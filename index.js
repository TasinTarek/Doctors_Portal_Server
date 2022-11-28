const express = require("express");
const cors = require('cors');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctaajm6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


async function run(){
    try{
        await client.connect();
        const servicesCollection = client.db('doctor_portal').collection('services');
        const bookingCollection = client.db('doctor_portal').collection('bookings');
        
       
        app.get('/service', async(req, res)=>{
            const query ={};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/available', async(req, res)=>{
          const date = req.query.date || 'NOV 26, 2022';
          //step 1 get all services
           const services= await servicesCollection.find().toArray();
          //step 2 get the booking of that day
          const query = {date: date};
          const bookings = await bookingCollection.find(query).toArray();
          //step 3 for each services, find bookings for service 
          services.forEach(service =>{
            const serviceBookings = bookings.filter(b => b.treatment === service.name)
            const booked = serviceBookings.map((s) => s.slots);
            service.booked = booked;
            
          })
           res.send(services);
        })

       app.post('/booking', async(req, res)=>{
        const booking = req.body;
        const query ={treatment: booking.treatment, date: booking.date, patient: booking.patient}
        const exists = await bookingCollection.findOne(query);
        if(exists){
          return res.send({success: false, booking: exists})
        }
        const result = await bookingCollection.insertOne(booking);
        return res.send({success: true, result});
       })

       
    }
    finally{

    }
}
run().catch(console.dir);




app.use(cors());
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Hello Patient!");
});

app.listen(port, () => {
  console.log(`Doctor app listening on port ${port}`);
});
