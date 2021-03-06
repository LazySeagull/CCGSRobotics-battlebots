var prevPacket;
var JoyStickPacket;
var keyboardControls = false;
var isJoystickActive;
const socket = new WebSocket('ws://'+location.hostname+':9999');

function MovementKey(keyID, yValue, xValue) {
    this.keyID = keyID;
    this.currentlyPressed = false,
    this.xValue = xValue;
    this.yValue = yValue;

    this.onPress = function () {
        this.currentlyPressed = true;
    },
    this.onRelease = function () {
        this.currentlyPressed = false;
    }
}

var movementKeys = [
    new MovementKey("w", -200, 0), new MovementKey("ArrowUp", -200, 0),
    new MovementKey("a", 0, -200), new MovementKey("ArrowLeft", 0, -200),
    new MovementKey("s", 200, 0), new MovementKey("ArrowDown", 200, 0),
    new MovementKey("d", 0, 200), new MovementKey("ArrowRight", 0, 200)
    ]

// A "VirtualJoystick" object is created.
var joystick = new VirtualJoystick({
    container   : document.getElementById('container'),
    mouseSupport: true,
});

function calculateMovementPacket(){
    // Sets the initial movement packet to 0|0. This is the packet of a stationary robot.
    var xSum = 0;
    var ySum = 0;

    movementKeys.forEach(function (key, index) {
        if(key.currentlyPressed === true) {
            xSum += key.xValue;
            ySum += key.yValue;
        }
    })

    xSum += joystick.deltaX();
    ySum += joystick.deltaY();

    packet = convertJoyStickToLimitedPolarCoords(xSum,ySum)
    
    if(Math.abs(packet.angle) == 180) {packet.angle = 180;}
    
    return "Wheels," + packet.distance + "," + packet.angle
}

// "sendPacket(packet)" will send a packet along the websocket, provided it doesn't match the previous data. 
// This prevents the websocket being clogged with unnecessary data packets.
function sendPacket(packet){
    if(packet != prevPacket) {
        console.log(packet)
        socket.send(packet)
        prevPacket = packet
    }
}

// Used to convert the x & y coordinates from the VirtualJoystick Object into a polar form (distance, angle).
function convertJoyStickToLimitedPolarCoords(x, y){
    distance = Math.round((Math.sqrt(x*x + y*y))/20)*10
    if(distance > 100) {
        distance = 100;
    }
    angle = Math.round((Math.atan2(y,x) * (180/Math.PI)+1)/30)*30*-1
    return {distance: distance, angle: angle};
};

document.addEventListener("keydown", function onEvent(event) {
    movementKeys.forEach(function (key, index) {
        if(event.key === key.keyID) {
            key.onPress();
        }
    })
});

document.addEventListener("keyup", function onEvent(event) {
    movementKeys.forEach(function (key, index) {
        if(event.key === key.keyID) {
            key.onRelease();
        }
    })
});

setInterval(function(){
    sendPacket(calculateMovementPacket())
}, 10);
