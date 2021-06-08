
// Sets up API controllers for User info

const { admin, db } = require('../util/admin');
const config = require('../util/config');

const firebase = require('firebase');

firebase.initializeApp(config);

const { validateLoginData, validateSignUpData } = require('../util/validators');


// User Login:
// - logs in a user and returns a token valid for 60minutes
// - returns error message if not validated
const loginUser = (req, res) => {

    const user = {
        email: req.body.email,
        password: req.body.password
    }

    const { valid, errors } = validateLoginData(user);

	if (!valid) {
        return res
                .status(400)
                .json(errors)
    };

    
    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then((data) => {
            return data.user.getIdToken();
        })
        .then((token) => {
            return res
                    .json({ token });
        })
        .catch((error) => {
            console.error(error);
            return res
                    .status(403)
                    .json({
                        general: 'Something was not correct, please try again'
                    });
        })
};



// User Signup:
// - signs up then logs in a user and returns a token valid for 60minutes
// - returns error message if username or email is already in use
const signUpUser = (req, res) => {

    const postBody = req.body;

    const newUser = {
        firstName: postBody.firstName,
        lastName: postBody.lastName,
        email: postBody.email,
		username: postBody.username,
        phoneNumber: postBody.phoneNumber,
		password: postBody.password,
		confirmPassword: postBody.confirmPassword
    };

    const { valid, errors } = validateSignUpData(newUser);

	if (!valid) {
        return res
                .status(400)
                .json(errors);
    };

    let token, userId;
    
    db
        .doc(`/users/${newUser.username}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                return res
                        .status(400)
                        .json({
                             username: 'Username is already in use' 
                        });
            } else {
                return firebase
                        .auth()
                        .createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idtoken) => {
            token = idtoken;
            const userCredentials = {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                username: newUser.username,
                phoneNumber: newUser.phoneNumber,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
            return db
                    .doc(`/users/${newUser.username}`)
                    .set(userCredentials);
        })
        .then(()=>{
            return res
                    .status(201)
                    .json({ token });
        })
        .catch((err) => {
			console.error(err);
			if (err.code === 'auth/email-already-in-use') {
				return res
                        .status(400)
                        .json({
                             email: 'Email is already in use' 
                        });
			} else {
				return res
                        .status(500)
                        .json({
                             general: 'Something was not right, please try again' 
                        });
			}
		});
};



// Gets user details
const getUserDetail = (req, res) => {
    
    let userData = {};
	db
		.doc(`/users/${req.user.username}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
                userData.userCredentials = doc.data();
                return res.json(userData);
			}	
		})
		.catch((error) => {
			console.error(error);
			return res
                    .status(500)
                    .json({
                         error: error.code 
                    });
		});
};



// Updates user details based on field(s) chosen
const updateUserDetails = (req, res) => {

    let document = db.collection('users').doc(`${req.user.username}`);

    document
        .update(req.body)
        .then(()=> {
            res.json({
                message: 'Updated successfully'
            });
        })
        .catch((error) => {
            console.error(error);
            return res
                    .status(500)
                    .json({ 
                        message: "Cannot update the value"
                    });
        });
}



// Upload user profile picture to Firebase Storage
const uploadProfilePhoto = (req, res) => {
    const BusBoy = require('busboy');
	const path = require('path');
	const os = require('os');
	const fs = require('fs');
	const busboy = new BusBoy({ headers: req.headers });

	let imageFileName;
	let imageToBeUploaded = {};

	busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
		if (mimetype !== 'image/png' && mimetype !== 'image/jpeg') {
			return res.status(400).json({ error: 'Wrong file type submited' });
		}
		const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${req.user.username}.${imageExtension}`;
		const filePath = path.join(os.tmpdir(), imageFileName);
		imageToBeUploaded = { filePath, mimetype };
		file.pipe(fs.createWriteStream(filePath));
    });

    deleteImage(imageFileName);
	busboy.on('finish', () => {
		admin
			.storage()
			.bucket()
			.upload(imageToBeUploaded.filePath, {
				resumable: false,
				metadata: {
					metadata: {
						contentType: imageToBeUploaded.mimetype
					}
				}
			})
			.then(() => {
				const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
				return db.doc(`/users/${req.user.username}`).update({
					imageUrl
				});
			})
			.then(() => {
				return res
                        .json({
                             message: 'Image uploaded successfully' 
                        });
			})
			.catch((error) => {
				console.error(error);
				return res
                        .status(500)
                        .json({
                             error: error.code 
                        });
			});
	});
	busboy.end(req.rawBody);
};


// Delete user image
deleteImage = (imageName) => {
    const bucket = admin.storage().bucket();
    const path = `${imageName}`
    return bucket.file(path).delete()
    .then(() => {
        return
    })
    .catch((error) => {
        return
    })
};



module.exports = {
    loginUser,
    signUpUser,
    uploadProfilePhoto,
    getUserDetail,
    updateUserDetails,
};