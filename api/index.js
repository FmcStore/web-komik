const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Koneksi MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("DB Connected"))
    .catch(err => console.log(err));

// Schema Mapping UUID
const Mapping = mongoose.model('Mapping', new mongoose.Schema({
    uuid: { type: String, unique: true },
    slug: String,
    type: String // 'series' atau 'chapter'
}));

// Endpoint: Generate UUID dari Slug
app.post('/api/get-id', async (req, res) => {
    try {
        const { slug, type } = req.body;
        let data = await Mapping.findOne({ slug, type });
        if (!data) data = await Mapping.create({ uuid: uuidv4(), slug, type });
        res.json({ uuid: data.uuid });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Endpoint: Ambil Slug dari UUID
app.get('/api/get-slug/:uuid', async (req, res) => {
    try {
        const data = await Mapping.findOne({ uuid: req.params.uuid });
        if (data) res.json(data);
        else res.status(404).json({ error: "Not Found" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
