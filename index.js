const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const bodyParser = require('body-parser');
require('dotenv').config();
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 3020;


const app = express();
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static('doctors'));
app.use(fileUpload());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.smblb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    console.log('err', err);
    const appointmentCollection = client.db("doctorsPortal").collection("appointments");
    const doctorCollection = client.db("doctorsPortal").collection("doctors");

    app.post('/addAppointment', (req, res) => {
        const appointment = req.body;
        appointmentCollection.insertOne(appointment)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/appointments', (req, res) => {
        appointmentCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.post('/appointmentsByDate', (req, res) => {
        const date = req.body;
        const email = req.body.email;
        // console.log('date', date);
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {
                console.log('doctors', err, doctors);
                const filter = { date: date.date };
                if (doctors.length === 0) {
                    filter.email = email;
                }
                appointmentCollection.find(filter)
                    .toArray((err, documents) => {
                        console.log('docs', documents);
                        res.send(documents);
                    })
            })
    })

    app.post('/addDoctor', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const number = req.body.number;
        console.log(name, email, file);
        // const filePath = `${__dirname}/doctors/${file.name}`;
        // console.log(name, email, file);
        // file.mv(filePath, err => {
        //     if (err) {
        //         console.log(err);
        //         return res.status(500).send({ msg: 'Failed to upload Image in server' });
        //     }
        //     return res.send({ name: file.name, path: `/${file.name}` })
        // })
        // const newImg = fs.readFileSync(filePath);
        const newImg = file.data;
        const encImg = newImg.toString('base64');
        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer(encImg, 'base64')
        };

        doctorCollection.insertOne({ name, email, number, image })
            .then(result => {
                console.log('result', result);

                res.send(result.insertedCount > 0);
            })
    })

    app.get('/doctors', (req, res) => {
        doctorCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.post('/isDoctor', (req, res) => {
        const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {
                res.send(doctors.length > 0);
            })
    })



});



app.get('/', (req, res) => {
    res.send('Hello Doctor Portal!');
})


app.listen(port);
