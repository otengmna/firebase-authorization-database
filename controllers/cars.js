const { db } = require('../util/admin');


// Add are to Firestore database
const addCar = (req, res) => {

	const postBody = req.body;

	if (!(postBody)) {
		return res
				.status(400)
				.json({ 
					success: false, 
					error: 'Please enter a Car' 
				});
    };

	if (typeof(postBody.year) != "number") {
		return res
				.status(400)
				.json({ 
					success: false, 
					error: 'Please enter a Year' 
				});
    };

	if (!(postBody.make)) {
		return res
				.status(400)
				.json({ 
					success: false, 
					error: 'Please enter a Make' 
				});
    };
    
    const newCar = {
		title: `${postBody.year} ${postBody.make} ${postBody.model}`,
		year: postBody.year,
   		make: postBody.make,
   		model: postBody.model,
        username: req.user.username,
    };

	if(!newCar){
        return res
				.status(400)
				.json({
        		    success: false,
        		    error: err
        		});
    };

    db
        .collection('cars')
        .add(newCar)
        .then((doc)=>{
			return res.status(201).json({
				success: true,
				id: newCar.carId,
				message: 'Sucessfully added a new car'
			});
        })
        .catch((err) => {
			res
				.status(400)
				.json({
					error,
					message: 'Car not added'
				});
			console.error(err);
		});
};


// Get all cars info as json
const getAllCars = (req, res) => {

    db
		.collection('cars')
        .where('username', '==', req.user.username)
		.orderBy('make', 'desc')
		.get()
		.then((data) => {

			let cars = [];

			data.forEach((doc) => {
				cars.push({
					carId: doc.id,
					title: `${doc.data().year} ${doc.data().make} ${doc.data().model}`,
					year: doc.data().year,
   					make: doc.data().make,
   					model: doc.data().model,
				});
			});
            
			return res.json(cars);
		})
		.catch((err) => {
			console.error(err);
			return res.status(500)
                      .json({ error: err.code});
		});
};


// Delete one car from database
const deleteOneCar = (req, res) => {

	selectedCar = req.params.carId;

	const carDoc = db.doc(`/cars/${selectedCar}`);

    carDoc
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return res
					    .status(404)
					    .json({ 
					    	success: false,
					    	message: 'Car does not exist'
					    });
            };

            if(doc.data().username !== req.user.username){
                return res
                        .status(403)
                        .json({ error: "UnAuthorized" });
            };

            return document.delete();
        })
        .then(() => {
            res
				.json({
					success: true,
					message: 'Successfully deleted car' 
				});
        })
        .catch((err) => {
            console.error(err);
            return res
                    .status(500)
                    .json({ error: err.code });
        });
};


// Edit car post
const editCar = (res, req) => {

    if (req.body.carId){
        res.status(403).json({message: 'Not allowed to edit'})
    }

    let carDoc = db.collection('cars').doc(`${req.params.carID}`);

    carDoc.update(req.body)
          .then(() => {
              res.json({message: 'Car updated successfully'});
          })
          .catch((err) => {
              return res.status(500)
                        .json({ error: err.code });
          });
};



module.exports = {
	addCar,
    getAllCars,
	deleteOneCar,
    editCar,
}