const express = require('express')
const app = express()

app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: false }));

//app.use(bodyParser.json({ limit: "10gb"}))
//app.use(bodyParser.urlencoded({ extended: true, limit: "10gb", parameterLimit: 100000 }))
// app.use(upload.array()); 

const viewsDir = '.'; //path.join(__dirname, 'views')
app.use(express.static(viewsDir))

app.get("/", (req, res) => {
   res.sendFile(__dirname + '/index.html');
});

app.listen(8000, () => console.log('Listening on port 8000!'))
