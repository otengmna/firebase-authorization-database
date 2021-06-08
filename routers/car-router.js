const express = require('express');

const carsController = require('../controllers/cars');
const authorization = require('../util/authorization');

const router = express.Router();


// api routers for cars
router.get('/cars', authorization, carsController.getAllCars);
router.post('/cars', authorization, carsController.addCar);
router.delete('/cars/:carId', authorization, carsController.deleteOneCar);
router.put('/cars/:carId', authorization, carsController.editCar);


module.exports = router;