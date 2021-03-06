// node modules
var express = require('express');
const mongoose = require('mongoose');
var mapRouter = express.Router();
const multer = require('multer');
const fs = require('fs')

const passport = require("passport");
const verifyUser = passport.authenticate("jwt", { session: false });



// File modules

const MapDataModel = require('../models/mapDataModel')
const fileManager = require('../config/fileManager')




// to get all map points

mapRouter.route('/map_points')
  .get(
     verifyUser, 
    async (req, res, next) => {
  
try {
  
    let data = await MapDataModel.find({userId: req.user.id}).
    select('plantNumber longitude latitude longitudeDelta latitudeDelta markerKey imagePath date _id')
    .sort({'updatedAt': 1});

    if(data.length == 0)
    {
        return res.status(200)
      .json({success:false, message:"No record found against this user id 1"});
    }
    
    res.status(200)
    .json({success:true, data:data});

  } catch (error) {
    console.log(error);
  }
})
.put(verifyUser, (req, res, next) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on map/map_points');
})
.post(
  verifyUser, 
   fileManager.uploadMapImage.array('imageFile', 10) , async (req, res, next) => {

try {

    if(req.files.length == 0){
      return res.status(400).json("Attach a(n) Image(s)");
    }

    if(!req.body.longitude || !req.body.latitude){
        return res.status(400).json("Provides all parameters i.e. longitude and latitude");
    }

    
    req.body.imagePath = [];
    
    for (let i = 0; i < req.files.length; i++) {
      req.body.imagePath.push(req.files[i].path); 
    }

    req.body.userId = req.user.id;

  
    req.body.date = new Date();

    await MapDataModel.create(req.body);

    res.status(200)
    .json({success:"true", message:"Data and images successfully saved"});

} catch (error) {
  console.log(error);
}

})
.delete(verifyUser,  async (req, res, next) => {

  try{
    // for testing
    // req.body.userId = '5f2b2b535107e40378108adf';
    req.body.userId = req.user.id;

    let result = await MapDataModel.find( {userId: req.body.userId} ).select('imagePath -_id');
    
    if(result.length == 0){
      return res.status(200)
      .json({success:false, message:"No record found to be deleted against this user_id"});
    }
    

    // extracting images paths
    let imagePaths = [];
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < result[i].imagePath.length; j++) {
        imagePaths.push( result[i].imagePath[j] );
      }
    }
    
  
    
    let result2 = await MapDataModel.deleteMany({userId: req.body.userId})
    // console.log("result: " , result);

    if(result2.n == 0){
      return res.status(200)
        .json({success:false, message:"No record found to be deleted against this user_id"});
    }

    for (let i = 0; i < imagePaths.length; i++) {
      console.log("filePath : " + imagePaths[i] );
      await fileManager.DeleteFile(imagePaths[i] );
    }

    return res.status(200)
      .json({success:true , message: result2.n + " Map point/s successfully deleted"});

  } catch (error) {
    console.log(error);
  }
      
});


mapRouter.route('/map_points/:plant_id')
.get(
  verifyUser,  
  async (req, res, next) => {

  try{
      // for testing
    // req.user = {};
    // // req.user.id = '5f2b2b535107e40378108adf';
    // req.user.id = req.params.userId;
    // req.user = {};
    // req.user.id = "5f3853605701371f50291bfe";

    let data = await MapDataModel.find({userId: req.user.id, _id: req.params.plant_id}).
      select('plantNumber longitude latitude imagePath longitudeDelta latitudeDelta markerKey date -_id');

    if(data.length == 0)
    {
      return res.status(200)
        .json({success:false, message:"No record found against this user id and plant_number"});
    }
    
    res.status(200)
    .json({success:true, data:data});
  } catch (error) {
    console.log(error);
  }
})
.put(verifyUser, async (req, res, next) => {

try{
    
    req.body.date = new Date();

    let result = await MapDataModel.findByIdAndUpdate( 
      { _id: req.params.plant_id} ,
      req.body    
    );

    return res.status(200)
    .json({success:true, message:"Record successfully updated"});

  } catch (error) {
    console.log(error);
  }
  
})
.post(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('POST operation not supported on map/map_points/:plant_number');
})
.delete(verifyUser,   async (req, res, next) => {

  try{
      
    req.body.userId= req.params.userId;

    // for testing
    // req.body.userId = '5f2b2b535107e40378108adf';
    req.body.userId = req.user.id;

    let result = await MapDataModel.find( {userId: req.body.userId} ).select('imagePath -_id');
    
    if(result.length == 0){
      return res.status(200)
      .json({success:false, message:"No record found to be deleted against this user_id"});
    }
    

    // extracting images paths
    let imagePaths = result[0].imagePath;

    // for (let i = 0; i < imagePaths.length; i++) {

    //   console.log("imagePaths ["+i+"] : " + imagePaths[i] );
    // }

    // console.log("imagePaths.length: " , imagePaths.length);
    
    let result2 = await MapDataModel.deleteOne({userId: req.body.userId, _id: req.params.plant_id})
    // console.log("result: " , result);

    if(result2.n == 0){
      return res.status(200)
        .json({success:false, message:"No record found to be deleted against this user_id"});
    }

    for (let i = 0; i < imagePaths.length; i++) {
      console.log("filePath : " + imagePaths[i] );
      await fileManager.DeleteFile(imagePaths[i] );
    }

    return res.status(200)
      .json({success:true , message: "Map point successfully deleted"});

    } catch (error) {
      console.log(error);
    }

});





mapRouter.route('/total_trees_planted/overall')
.get(  async (req, res, next) => {

  try{

    // for testing
    // req.user = {};
    // req.user.id = '5f2b2b535107e40378108adf';


    let data = await MapDataModel.find();

    if(data.length == 0)
    {
      return res.status(200)
        .json({success:false, message:"No record found"});
    }

    res.status(200)
    .json({success:true, total_plants:data.length});

  } catch (error) {
    console.log(error);
  }

})
.post(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('POST operation not supported on map/total_trees_planted/overall');
})
.delete(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('DELETE operation not supported on map/total_trees_planted/overall');
})
.put(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on map/total_trees_planted/overall');
});




mapRouter.route('/total_trees_planted/today')
.get( async (req, res, next) => {

  // for testing
  // req.user = {};
  // // req.user.id = '5f2b2b535107e40378108adf';
  // req.user.id = req.params.userId;

  try{
      
    let data = await MapDataModel.find();

    if(data.length == 0)
    {
      return res.status(200)
        .json({success:false, message:"No record found"});
    }

    var currentDate = new Date();
    var count = 0;
    for (let i = 0; i < data.length; i++) {
      
      console.log(data[i].updatedAt);
      
      let temp = await timeDifferenceInDays(data[i].date, currentDate);
      // console.log("temp : " + temp);
      if(temp <= 1)
      {
        count++;
        // console.log("YES !!");
      }
    }

    res.status(200)
    .json({success:true, total_plants:count});

  } catch (error) {
    console.log(error);
  }

})
.post(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('POST operation not supported on map/total_trees_planted/today');
})
.delete( verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('DELETE operation not supported on map/total_trees_planted/today');
})
.put( verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on map/total_trees_planted/today');
});



mapRouter.route('/total_trees_planted/this_week')
.get(  async (req, res, next) => {

  try{
      
    // for testing
    // req.user = {};
    // req.user.id = '5f2b2b535107e40378108adf';
    // req.user.id = req.params.userId;


    let data = await MapDataModel.find();

    if(data.length == 0)
    {
      return res.status(200)
        .json({success:false, message:"No record found"});
    }

    var currentDate = new Date();
    var count = 0;
    for (let i = 0; i < data.length; i++) {
      
      console.log(data[i].updatedAt);
      
      let temp = await timeDifferenceInDays(data[i].date, currentDate);
      // console.log("temp : " + temp);
      if(temp <= 7)
      {
        count++;
        // console.log("YES !!");
      }
    }

    res.status(200)
    .json({success:true, total_plants:count});

  } catch (error) {
    console.log(error);
  }

})
.post(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('POST operation not supported on map/total_trees_planted/this_week');
})
.delete(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('DELETE operation not supported on map/total_trees_planted/this_week');
})
.put(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on map/total_trees_planted/this_week');
});




mapRouter.route('/total_trees_planted/this_month')
.get(  async (req, res, next) => {

  try{

      
    // for testing
    // req.user = {};
    // // req.user.id = '5f2b2b535107e40378108adf';
    // req.user.id = req.params.userId;


    let data = await MapDataModel.find();

    if(data.length == 0)
    {
      return res.status(200)
        .json({success:false, message:"No record found"});
    }

    var currentDate = new Date();
    var count = 0;
    for (let i = 0; i < data.length; i++) {
      
      console.log(data[i].updatedAt);
      
      let temp = await timeDifferenceInDays(data[i].date, currentDate);
      // console.log("temp : " + temp);
      if(temp <= 30)
      {
        count++;
        // console.log("YES !!");
      }
    }

    res.status(200)
    .json({success:true, total_plants:count});

  } catch (error) {
    console.log(error);
  }

})
.post( verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('POST operation not supported on map/total_trees_planted/this_month');
})
.delete(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('DELETE operation not supported on map/total_trees_planted/this_month');
})
.put(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on map/total_trees_planted/this_month');
});




mapRouter.route('/total_trees_planted/user')
.get(  async (req, res, next) => {

  try{      
    // for testing
    // req.user = {};
    // // req.user.id = '5f2b2b535107e40378108adf';

    // req.user.id = req.params.userId;

    
    let data = await MapDataModel.find({userId: req.user.id});

    if(data.length == 0)
    {
      return res.status(200)
        .json({success:false, message:"No record found against this user id 2"});
    }
    res.status(200)
    .json({success:true, total_plants:data.length});

  } catch (error) {
    console.log(error);
  }
})
.post(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('POST operation not supported on map/total_trees_planted/user/:userId');
})
.delete(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('DELETE operation not supported on map/total_trees_planted/user/:userId');
})
.put(verifyUser,  async (req, res, next) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on map/total_trees_planted/user/:userId');
});




mapRouter.route('/pictures/:plant_id')
.get( async (req, res, next) => {
  res.statusCode = 403;
  res.end('GET operation not supported on map/map_points/pictures/:plant_id');
})
.put( async (req, res, next) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on map/map_points/pictures/:plant_id');
})
.post(verifyUser, fileManager.uploadMapImage.single('imageFile'), async (req, res, next) => {

  try{
    // req.user = {};
    // req.user.id = '5f2b2b535107e40378108adf';

    let data = await MapDataModel.findOne(
      {
        _id : req.params.plant_id,
        userId : req.user.id
    });

    if(!data)
    {
        return res.status(200)
        .json({success:false, message:"No record found to be deleted against this user_id / plant_id"});
    }

    console.log("req.file : ", req.file);

    data.imagePath.push(req.file.path);

    await data.save();

   
    return res.status(200)
    .json({success:true, message:"image successfully inserted"});

  } catch (error) {
    console.log(error);
  }


})
.delete(verifyUser, async (req, res, next) => {

  try{
    // req.user = {};
    // req.user.id = '5f2b2b535107e40378108adf';

    let data = await MapDataModel.findOne(
      {
        _id : req.params.plant_id,
        userId : req.user.id,
        imagePath : req.body.path
    });

    if(!data)
    {
        return res.status(200)
        .json({success:false, message:"No record found to be deleted against this user_id / plant_id / image path"});
    }

    // console.log("res : ", data);

    let index = data.imagePath.indexOf(req.body.path);
    // console.log("index : " + index);

    await fileManager.DeleteFile( req.body.path );

    data.imagePath.splice(index, 1);
    // console.log("imagePath : " + data.imagePath);

    await data.save();

    return res.status(200)
        .json({success:true, message:"image successfully deleted"});
    
  } catch (error) {
    console.log(error);
  }

});


async function timeDifferenceInDays(_date, _currentDate)
{
  const diffTimemillisec = Math.abs(_currentDate - _date);
  const diffTimesec = diffTimemillisec/1000;
  const diffDays = (diffTimemillisec / (1000 * 60 * 60 * 24)).toFixed(2); 
  const diffDaysround = Math.round(diffDays); 

  // console.log("diffTimemillisec: " + diffTimemillisec);
  // console.log("diffTimesec: " + diffTimesec);
  // console.log("diffDays     : " + diffDays);


  // console.log("diffDaysround: " + diffDaysround);
  
  return diffDaysround;
}


mapRouter.put('/like/:plantId', async function(req, res, next) {

  let result = await MapDataModel.findOne({_id: req.params.plantId})

  result.likes++;

  await result.save();

  return res.status(200)
  .json({success:true, message:"marker successfully liked", newLikes:result.likes });

});



mapRouter.get('/test', function(req, res, next) {

  res.status(200).json({success: true, message: "Reply from the server"});
});



module.exports = mapRouter;
