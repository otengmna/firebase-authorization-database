const express = require('express');

const loginUserController = require('../controllers/users');
const authorization = require('../util/authorization');

const router = express.Router();


// api routes for the users
router.post('/login', loginUserController.loginUser);
router.post('/signup', loginUserController.signUpUser);
router.get('/user', authorization, loginUserController.getUserDetail);
router.post('/user', authorization, loginUserController.updateUserDetails);

//api routes for the photos
// an authentication layer so that only a user associated with that account can upload an image
router.post('/user/profile-image', authorization, loginUserController.uploadProfilePhoto);


module.exports = router;