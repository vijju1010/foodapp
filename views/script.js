deleteItem = (id) => {
    fetch('/deletefood', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ foodid: id }),
    })
        .then((r) => r.json())
        .then((result) => {
            if (result.succeeded) {
                location.reload();
            }
        })
        .catch(console.error);
    console.log('delete', id);
};

editfood = (id) => {
    console.log('edit', id);
    document.getElementById(id).disabled = false;
    document.getElementById(id + 'sb').style.display = 'block';
    document.getElementById(id + 'sopt').style.display = 'block';
    document.getElementById(id + 'eb').style.display = 'none';
    document.getElementById(id + 'db').style.display = 'none';
};
