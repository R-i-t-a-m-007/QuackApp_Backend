const express = require('express');
const router = express.Router();
const Company = require('../models/Company');

// Add a new company
router.post('/add', async (req, res) => {
  try {
    const { name, email, phone, address, country, city, postcode } = req.body;

    // Create a new company document
    const newCompany = new Company({
      name,
      email,
      phone,
      address,
      country,
      city,
      postcode,
    });

    // Save to the database
    const savedCompany = await newCompany.save();
    res.status(201).json({ message: 'Company added successfully', data: savedCompany });
  } catch (error) {
    res.status(500).json({ message: 'Error adding company', error: error.message });
  }
});

module.exports = router;
