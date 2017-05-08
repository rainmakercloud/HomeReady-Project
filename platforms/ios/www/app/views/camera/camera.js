angular.module('homeready').controller("CameraCtrl", function($scope,$state,$stateParams,$rootScope,$ionicPlatform,$timeout) {
  
  $scope.snapshotTimestamp = Date.now();
  $scope.reverseCameraTimestamp = Date.now();
  var workItemId = undefined;
  $scope.$on('$ionicView.enter',function($event,data){
    workItemId = data.stateParams.workItemId;
    $ionicPlatform.ready(function() {
        if (window.ezar) {
        ezar.initializeVideoOverlay(
            function() {
            ezar.getBackCamera().start();
            },
                function(err) {
                    console.log('unable to init ezar: ' + err);
                });	  
        }
        else console.log('Unable to load camera');
    });
  });
    $ionicPlatform.ready(function() {
        if (window.ezar) {
        ezar.initializeVideoOverlay(
            function() {
            ezar.getBackCamera().start();
            },
                function(err) {
                    alert('unable to init ezar: ' + err);
                });	  
        }
    });
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
              function(dataURI) {
                  if(dataURI)
                  console.log('Image Data Length: ',dataURI.length);
                  //perform screen capture
                  $scope.imgURI = dataURI;
                  console.log("Image Uri",$scope.imgURI.length);
                  if (!$scope.images)
                  $scope.images = [];
                  $scope.images.push($scope.imgURI);
                  console.log("Camera Image");
                  for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
                    if ($rootScope.workItemsArray[i].Id == $rootScope.currentWorkItemId){
                      if($scope.imgURI)
                      $rootScope.workItemsArray[i].Property_Documents__r.records.push({
                        Id: Date.now(),
                        Photo_Rotation__c: 0,
                        Work_Item__c: $rootScope.currentWorkItemId,
                        Property__c: $rootScope.activeJob.Repair_Project__r.Property__r.Id,
                        Document_Group__c: 'Rehab',
                        Document_Type__c: 'Rehab Photo - After',
                        File_URL__c: $scope.imgURI
                      });
                      break;
                    }
                  }
                  console.log($rootScope.activeJob.Repair_Project__r.Property__r.Id);
                  if($scope.imgURI)
                  $rootScope.updateQueue.push({
                    type: 'Property_Document__c',
                    isNew: true,
                    attachment: {
                      Body: $scope.imgURI
                    },
                    fields: {
                      Photo_Rotation__c: 0,
                      Work_item__c: $rootScope.currentWorkItemId,
                      Property__c: $rootScope.activeJob.Repair_Project__r.Property__r.Id,
                      Document_Group__c: 'Rehab',
                      Document_Type__c: 'Rehab Photo - After'
                    }
                  });
                  if($scope.imgURI)
                  localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
                      console.log("Update Saved");
                    },
                    function(error) {
                      console.log(error);
                    });
                    if($scope.imgURI)
                  localforage.setItem('WorkItems', $rootScope.workItemsArray).then(function() {
                      console.log("All WorkItems Saved!");
                      $rootScope.assembleJobsAndCalculate();
                    },
                    function(error) {
                      //console.log(error);
                      console.log(error);
                    });
                  //show snapshot button
                  if (inclWebView && !inclCameraBtns) {
                    snapshotBtn.classList.remove("hide");        
                    revCameraBtn.classList.remove("hide");
                  }
                  $state.go('detail');
              },function(error){
                console.log('Error occured: ', error);
                $state.go('detail');
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
