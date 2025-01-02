const datetime = document.getElementById('datetime');
if (datetime) {
    datetime.innerText = new Date().toLocaleString();
}