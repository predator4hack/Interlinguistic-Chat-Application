const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $messages = document.querySelector("#message");
const $geolocationButton = document.querySelector("#send-location");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
    "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Hight of the message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageheight = $newMessage.offsetHeight + newMessageMargin;

    // Visible Height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have I scrolled
    const scrollOffeset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageheight <= scrollOffeset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on("message", (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("location-message", (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        message: message.url,
        createdAt: moment(message.createdAt).format("h:mm a"),
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    });
    document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // Disable
    $messageFormButton.setAttribute("disabled", "disabled");

    const message = document.querySelector("input").value;
    console.log(message);
    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();
        // Enable
        if (error) {
            return console.log(error);
        }
    });
});

$geolocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("geolocation is not supported by your browser");
    }
    $geolocationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit(
            "sendLocation",
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            () => {
                $geolocationButton.removeAttribute("disabled");
                console.log("Location Shared!");
            }
        );
        console.log("Send Location");
    });
});

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
