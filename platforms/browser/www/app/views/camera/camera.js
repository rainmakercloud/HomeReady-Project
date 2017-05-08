angular.module('homeready').controller("CameraCtrl", function($scope, $timeout) {
  
  $scope.snapshotTimestamp = Date.now();
  $scope.reverseCameraTimestamp = Date.now();

  $scope.snapshot = function() {
          //ignore ghost clicks, wait 1.5 sec between invocations
          if (Date.now() - $scope.snapshotTimestamp < 1500) return;
          $scope.snapshotTimestamp = Date.now();
          
          //get snapshot & revcamera buttons to hide/show
          var snapshotBtn = document.getElementById("snapshot");
          var revCameraBtn = document.getElementById("revcamera");
          
          var inclWebView = false;    // include/exclude webView content on top of cameraView
          var inclCameraBtns = false; // show/hide snapshot & revcamera btns

          if (inclWebView && !inclCameraBtns) {
              revCameraBtn.classList.add("hide");
              snapshotBtn.classList.add("hide");              
          }

          setTimeout(function() {
            ezar.snapshot(
              function(data) {
                  console.log('Image Data: ',data);
                  //perform screen capture
                  //show snapshot button
                  if (inclWebView && !inclCameraBtns) {
                    snapshotBtn.classList.remove("hide");        
                    revCameraBtn.classList.remove("hide");
                  }
              },function(error){
                console.log('Error occured: ', error);
              },
              {encodingType: ezar.ImageEncoding.PNG,
               includeWebView: inclWebView,
               saveToPhotoAlbum: true});   
          },200);   
    };

    $scope.reverseCamera = function() {
      //ignore ghost clicks, wait 1.5 sec between invocations
      if (Date.now() - $scope.reverseCameraTimestamp < 1500) return;
      $scope.reverseCameraTimestamp = Date.now();

      var camera = ezar.getActiveCamera();
      if (!camera) {
        return; //no camera running; do nothing
      }

      var newCamera = camera;
      if (camera.getPosition() == "BACK" && ezar.hasFrontCamera()) { 
            newCamera = ezar.getFrontCamera();
      } else  if (camera.getPosition() == "FRONT" && ezar.hasBackCamera()) { 
            newCamera = ezar.getBackCamera();
      }

      if (newCamera) {
        newCamera.start();
      }
    }
})
