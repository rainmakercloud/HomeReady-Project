angular.module('homeready').controller('DetailCtrl', function($scope,$window, $q, $ionicPopup, $ionicScrollDelegate, $location, $ionicLoading, $parse, $ionicBackdrop, force, $rootScope, $state, $ionicNavBarDelegate, $timeout, $ionicSlideBoxDelegate, $interval, $ionicModal, $cordovaCamera, $cordovaDevice, $cordovaFile) {

  // ON PAGE LOAD

  $scope.$on('$ionicView.loaded', function() {

    if ($rootScope.user) {

    } else {
      $state.go('login');
      $rootScope.menuOverlay = false;
    }

    $scope.imgURI = "";
    $scope.iPad = $cordovaDevice.device.uuid;
    $scope.activeGroups = $scope.filterGroupWorkItems($rootScope.activeFilter);
    $rootScope.walkThrough = true;
    $rootScope.backButton = true;
    $rootScope.menuToggle = true;
    $rootScope.menuOverlay = true;
    $scope.productImagePopup = false;
    if (!$rootScope.inSync && !$rootScope.syncing) {
      $rootScope.outSync = true;
    }
    else if(!$rootScope.outSync && !$rootScope.inSync){
      $rootScope.syncing = true;
    }
    else if(!$rootScope.outSync && !$rootScope.syncing ){
      $rootScope.inSync = true;
    };
    $scope.activeWorkItems = [];
    $rootScope.backToLandingView = function(){
      $state.go('landing');
    }
    $rootScope.backToState = function() {
      $rootScope.groupBookmark = undefined;
      $rootScope.workItemBookmark = undefined;
      $rootScope.activeJob = undefined;
      $rootScope.activeProjects = undefined;
      if($rootScope.includeAllJobs){
        $rootScope.activeProjects = angular.copy($rootScope.JobArray[$rootScope.activeJobArrayIndex].Job);
        $rootScope.activeJob = $rootScope.JobArray[$rootScope.activeJobArrayIndex].Job[$rootScope.activeJobIndex];
        $rootScope.backupJob = $rootScope.activeJob;
        $rootScope.includeAllJob($rootScope.activeJob, $rootScope.activeProjects, $rootScope.includeAllJobs);
      }
      else
        if($rootScope.includeChangeOrders){
          $rootScope.activeProjects = angular.copy($rootScope.JobArray[$rootScope.activeJobArrayIndex].Job);
          $rootScope.activeJob = $rootScope.JobArray[$rootScope.activeJobArrayIndex].Job[$rootScope.activeJobIndex];
          $rootScope.backupJob = $rootScope.activeJob;
          $rootScope.includeChangeOrder($rootScope.activeJob, $rootScope.activeProjects, $rootScope.includeChangeOrders);
        }

      else{
          $rootScope.activeJob = angular.copy($rootScope.JobArray[$rootScope.activeJobArrayIndex].Job[$rootScope.activeJobIndex]);
          $rootScope.activeProjects = angular.copy($rootScope.JobArray[$rootScope.activeJobArrayIndex].Job);
        }
      $state.go('summary');
    };
  });
//$scope.windowSize= angular.element($WindowProvider);

  var count = 1;
  $scope.activeClass = "btn-gray";
  $scope.defaultBgClass = "btn-gray";
  //$scope.open = false;
  $scope.isOpen = function() {

    $scope.getActiveWorkItems($rootScope.groupBookmark, 'isOPen',$scope.groupIndex);

  };
  $scope.isOpenGroup = function(gName) {
    if ($rootScope.groupBookmark != undefined) {
      return $rootScope.groupBookmark == gName;
    } else {
      return false;
    }

  }
  $scope.isOpenWorkItem = function(wID) {
    if ($rootScope.workItemBookmark !== undefined) {
      return $rootScope.workItemBookmark == wID;
    } else {
      return false;
    }
  };
  $rootScope.defaultImage = "/img/after-image-placeholder.jpg";

  $scope.getActiveWorkItems = function(groupType, type,index) {
    $scope.setAspectRatio();
    $scope.groupIndex = index;
    var headerTop = jQuery('.clearfix').offset().top;
    console.log("Header Top PX",headerTop);
    var groupHeaderOffset = jQuery('#groupHeader'+index).offset().top;
    console.log("Group Header Top px",groupHeaderOffset);
    var offsetTop = groupHeaderOffset - headerTop;
    //var top = 127 + (index * 61);
      var sc = 'translate3d('+ 0 +'px,-' + offsetTop +'px,'+ 0 +'px)';
      /*
      jQuery('#accordianHeader'+$scope.groupIndex).css({
          '-ms-transform':sc,
          '-moz-transform':sc,
          '-webkit-transform':sc,
          '-o-transform':sc
        });
      */
      $ionicScrollDelegate.scrollBy(0,offsetTop,true);
    if ($rootScope.groupBookmark == groupType && type == 'isNotOpen') {
      $rootScope.groupBookmark = undefined;
      $scope.group_header_scroll = 0;
      var sc = 'translate3d('+ 0 +'px,-' + 0 +'px,'+ 0 +'px)';
      jQuery('#accordianHeader'+$scope.groupIndex).css({
          '-ms-transform':sc,
          '-moz-transform':sc,
          '-webkit-transform':sc,
          '-o-transform':sc
        });
    } else {
      $rootScope.groupBookmark = groupType;
      for (var i = 0; i < $scope.activeGroups.length; i++) {
        if ($scope.activeGroups[i].Group_Name__c == groupType) {
          $timeout(function() {
            $rootScope.showLoading();
          }, 200);
          break;
        } else {
          $scope.activeGroups[i].WorkItems = [];
        }
      }
      $timeout(function() {
        var array = [];
        var obj = {};
        var groupId = '';
        var filter = $rootScope.activeFilter;
        for (var i = 0; i < $rootScope.activeJobs.length; i++) {
          for (var j = 0; j < $rootScope.activeJobs[i].Groups.length; j++) {
            if ($rootScope.activeJobs[i].Groups[j].Group_Name__c == groupType) {
              groupId = $rootScope.activeJobs[i].Groups[j].Id;
              angular.forEach($rootScope.workItemsArray, function(WorkItem) {
                obj = angular.copy(WorkItem);
                obj.Products_Materials__r = '';
                obj.Work_Logs__r = '';
                obj.Property_Documents__r = '';
                if (filter.Underway) {
                  if (obj.Status__c == "Underway" && obj.Group__c == groupId) {
                    array.push(obj);
                  }
                }
                if (filter.Deficient) {
                  if (obj.Status__c == "Deficient" && obj.Group__c == groupId) {
                    array.push(obj);
                  }
                }
                if (filter.Completed) {
                  if (obj.Status__c == "Completed" && obj.Group__c == groupId) {
                    array.push(obj);
                  }
                }
                if (filter.Verified) {
                  if (obj.Status__c == "Verified" && obj.Group__c == groupId) {
                    array.push(obj);
                  }
                }
              });
            }
          };

        };

        for (var i = 0; i < $scope.activeGroups.length; i++) {
          if ($scope.activeGroups[i].Group_Name__c == groupType) {
            $scope.activeGroups[i].WorkItems = array;
            break;
          }
        }
      }, 500);
    }
  };
  // ALL TOGGLE BUTTONS

  $scope.underwayFunc = function() {
    $scope.activeGroups = [];
    $scope.activeGroups = $scope.filterGroupWorkItems($rootScope.activeFilter);
    $scope.isOpen();
  };

  $scope.completeFunc = function() {
    $scope.activeGroups = [];
    $scope.activeGroups = $scope.filterGroupWorkItems($rootScope.activeFilter);
    $scope.isOpen();
  };
  $scope.deficientFunc = function() {
    $scope.activeGroups = [];
    $scope.activeGroups = $scope.filterGroupWorkItems($rootScope.activeFilter);
    $scope.isOpen();
  };
  $scope.verifiedFunc = function() {
    $scope.activeGroups = [];
    $scope.activeGroups = $scope.filterGroupWorkItems($rootScope.activeFilter);
    $scope.isOpen();
  };

  // PRODUCT AND HISTORY DETAILS

  $scope.getProductsHistory = function(workItemId, index) {
    getWorkItemProducts(workItemId).then(function(data) {
      $scope.products = data;
    });
    getWorkItemHistory(workItemId).then(function(data) {
      $scope.history = data;
    });
  };

  $scope.filterGroupWorkItems = function(filter) {
    console.log("Filter",filter);
    if (!filter) {
      filter = $rootScope.activeFilter;
    }
    $rootScope.showLoading();
    $scope.activeWorkItems = [];
    var blankGroup = [];
    var groupObj = {};
    angular.forEach($rootScope.currentGroups, function(group) {
      groupObj = angular.copy(group);
      groupObj.WorkItems = [];
      var flag = false;

        if (filter.Underway) {
          if (group.countUnderway > 0) {
            flag = true;
          }
        }
        if (filter.Deficient) {
          if (group.countDeficient > 0) {
            flag = true;
          }
        }
        if (filter.Completed) {
          if (group.countCompleted > 0) {
            flag = true;
          }
        }
        if (filter.Verified) {
          if (group.countVerified > 0) {
            flag = true;
          }
        }
        for (var i = 0; i < blankGroup.length; i++) {
          if (blankGroup[i].Group_Name__c == group.Group_Name__c) {
            flag = false;
          }
        }
        if (flag) {
          blankGroup.push(groupObj);
        }
    });
    return blankGroup;
  };

  $ionicModal.fromTemplateUrl('app/sku_image.html', {
    scope: $scope,
    animation: 'slide-in-up',
    backdropClickToClose: true
  }).then(function(modal) {
    $scope.modal_sku = modal;
  });

  $scope.showProductImage = function(product) {
    $scope.sku_data = {
      SKU_image : '/img/loading.gif',
      product_sku : ''
    };
    var testClose = $scope.modal_sku.show();
    testClose.then(function() {
    },function() {
      console.log("Test Close");
    });
    force.query("select id,File_URL__c from Property_Document__c where Products_Materials__c = '" + product.Id + "'").then(function(data) {
      if(data && product){
      if(data.records.length > 0 && product.SKU__c){
        $scope.sku_data.SKU_image = data.records[0].File_URL__c;
        $scope.sku_data.product_sku = product.SKU__c;
      }
      }



      //$scope.sku_image_html = '<div class="col" style="text-align:center"><img class="full-image" src="'+data.records[0].File_URL__c+'" style="height:300px;width:auto;"/><br/><label class="sku">SKU#'+product.SKU__c+'</label></div>';
    });

  };


  // ALL MARKED FUNCTIOND ACCORDING TO Status__c
  $scope.markAsUnderway = function(workItem, Notes,groupIndex,workItemIndex) {
    $rootScope.updateQueue.push({
      type: 'Work_item__c',
      fields: {
        Id: workItem.Id,
        Status__c: 'Underway',
        Note__c: Notes
      }
    });
    $rootScope.updateQueue.push({
      type: 'Work_Log__c',
      isNew: true,
      fields: {
        Work_Item__c: workItem.Id,
        Item_Status__c: 'Underway',
        Description__c: Notes,
        Date__c: new Date(),
        User__c: $rootScope.user.Name
      }
    });
    localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
        console.log("Update Saved");
        $scope.markCompleteNotes = undefined;
      },
      function(error) {
        console.log(error);
      });

    if (workItem.Status__c == 'Deficient') {
      $rootScope.currentGroup.countDeficient--;
    } else {
      $rootScope.currentGroup.countCompleted--;
    }
    $rootScope.currentGroup.countUnderway++;
    //$rootScope.showLoading();
    for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
      if ($rootScope.workItemsArray[i].Id == workItem.Id) {
        $rootScope.workItemsArray[i].Status__c = 'Underway';
        break;
      }
    }


    for (var i = 0; i < $rootScope.currentGroups.length; i++) {
      for (var j = 0; j < $rootScope.currentGroups[i].WorkItems.length; j++) {
        if ($rootScope.currentGroups[i].WorkItems[j].Id == workItem.Id) {
          $rootScope.currentGroups[i].WorkItems[j].Status__c = 'Underway';
          break;
        }
      }
    }
    localforage.setItem('WorkItems', $rootScope.workItemsArray).then(function() {
        console.log("All WorkItems Saved!");
        $rootScope.assembleJobsAndCalculate();
      },
      function(error) {
        //console.log(error);
        console.log(error);
      });
    $ionicScrollDelegate.scrollTop(false);
    $scope.activeGroups = $scope.filterGroupWorkItems($rootScope.activeFilter);
    var notificationPopup = $ionicPopup.alert({
      title: 'Work Item Status Changed',
      template: "Work Item Marked As Underway"
    }).then(function(res) {
      $scope.isOpen();
      $scope.setAspectRatio();
    })


  };
  var deviceID = $cordovaDevice.device.uuid;
  $scope.openMap = function(eve, LatLong, StreetAddress) {

    if (deviceID) {
      //window.open('http://maps.apple.com/?ll='+encodeURIComponent(LatLong.trim()), '_blank', 'location=no', 'hidden=yes');
      window.open('http://maps.apple.com/?address=' + encodeURIComponent(StreetAddress.trim()) + '&ll=' + encodeURIComponent(LatLong.trim()), '_blank', 'location=no,hidden=yes');
      //window.close();
    } else {
      window.open(eve.target.href, '_blank', 'location=no');
    }

  };

  $scope.markAsCompleted = function(workItem, Notes, image,groupIndex,workItemIndex) {
    var flag = false;
    for (var i = 0; i < $scope.currentWorkItem.Property_Documents__r.records.length; i++) {
      if ($scope.currentWorkItem.Property_Documents__r.records[i].Document_Type__c == "Rehab Photo - After") {
        flag = true;
        break;
      }

    }
    if (flag) {
      $rootScope.updateQueue.push({
        type: 'Work_item__c',
        fields: {
          Id: workItem.Id,
          Status__c: 'Completed',
          Note__c: Notes
        }
      });
      $rootScope.updateQueue.push({
        type: 'Work_Log__c',
        isNew: true,
        fields: {
          Work_Item__c: workItem.Id,
          Item_Status__c: 'Completed',
          Description__c: Notes,
          Date__c: new Date(),
          User__c: $rootScope.user.Name
        }
      });
      localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
          console.log("Update Saved");
          $scope.imgURI = undefined;
          $scope.markCompleteNotes = undefined;
        },
        function(error) {
          console.log(error);
        });

      $rootScope.currentGroup.countUnderway--;
      $rootScope.currentGroup.countCompleted++;

      for (var i = 0; i < $rootScope.currentGroups.length; i++) {
        for (var j = 0; j < $rootScope.currentGroups[i].WorkItems.length; j++) {
          if ($rootScope.currentGroups[i].WorkItems[j].Id == workItem.Id) {
            $rootScope.currentGroups[i].WorkItems[j].Status__c = 'Completed';
            break;
          }
        }
      }
      for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
        if ($rootScope.workItemsArray[i].Id == workItem.Id) {
          $rootScope.workItemsArray[i].Status__c = 'Completed';
          break;
        }
      }
      // });

      localforage.setItem('WorkItems', $rootScope.workItemsArray).then(function() {
          console.log("All WorkItems Saved!");
          $rootScope.assembleJobsAndCalculate();
        },
        function(error) {
          //console.log(error);
          console.log(error);
        });
      $ionicScrollDelegate.scrollTop(false);
      $scope.activeGroups = $scope.filterGroupWorkItems($rootScope.activeFilter);
      var notificationPopup = $ionicPopup.alert({
        title: 'Work Item Status Changed',
        template: "Work Item Marked As Completed"
      }).then(function(res) {
        $scope.isOpen();
        //$scope.setAspectRatio();
      });
      $scope.images = [];

    } else {
      var alertPopup = $ionicPopup.alert({
        title: 'Warning!',
        template: "You cannot Complete this Work Item until you have uploaded an After Photo."
      });
    }
  };

  $scope.markAsDeficient = function(workItem, Notes,groupIndex,workItemIndex) {
    //console.log(workItemIndex,groupIndex);
    if (Notes !== undefined) {
      $rootScope.updateQueue.push({
        type: 'Work_item__c',
        fields: {
          Id: workItem.Id,
          Status__c: 'Deficient',
          Note__c: Notes
        }
      });
      $rootScope.updateQueue.push({
        type: 'Work_Log__c',
        isNew: true,
        fields: {
          Work_Item__c: workItem.Id,
          Item_Status__c: 'Deficient',
          Description__c: Notes,
          Date__c: new Date(),
          User__c: $rootScope.user.Name
        }
      });
      localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
          console.log("Update Saved");
          $scope.markCompleteNotes = undefined;
        },
        function(error) {
          console.log(error);
        });

      if (workItem.Status__c == 'Verified') {
        $rootScope.currentGroup.countVerified--;
      } else if (workItem.Status__c == 'Completed') {
        $rootScope.currentGroup.countCompleted--;
      }
      $rootScope.currentGroup.countDeficient++;

      //$rootScope.showLoading();


      for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
        if ($rootScope.workItemsArray[i].Id == workItem.Id) {
          $rootScope.workItemsArray[i].Status__c = 'Deficient';
          break;
        }
      }
      for (var i = 0; i < $rootScope.currentGroups.length; i++) {
        for (var j = 0; j < $rootScope.currentGroups[i].WorkItems.length; j++) {
          if ($rootScope.currentGroups[i].WorkItems[j].Id == workItem.Id) {
            $rootScope.currentGroups[i].WorkItems[j].Status__c = 'Deficient';
            break;
          }
        }
      }
      localforage.setItem('WorkItems', $rootScope.workItemsArray).then(function() {
          console.log("All WorkItems Saved!");
          $rootScope.assembleJobsAndCalculate();
        },
        function(error) {
          //console.log(error);
          console.log(error);
        });
      $ionicScrollDelegate.scrollTop(false);
      $scope.activeGroups = $scope.filterGroupWorkItems($rootScope.activeFilter);
      var notificationPopup = $ionicPopup.alert({
        title: 'Work Item Status Changed',
        template: "Work Item Marked As Deficient"
      }).then(function(res) {
        $scope.isOpen();
        //$scope.setAspectRatio();
      });


    } else {
      var deficientAlertPopup = $ionicPopup.alert({
        title: 'Warning!',
        template: "A Note is required before updating the Work Item Status to Deficient."
      });
    }
  };

  $scope.markAsVerified = function(workItem, Notes,groupIndex,workItemIndex) {
    $rootScope.updateQueue.push({
      type: 'Work_item__c',
      fields: {
        Id: workItem.Id,
        Status__c: 'Verified',
        Note__c: Notes
      }
    });
    $rootScope.updateQueue.push({
      type: 'Work_Log__c',
      isNew: true,
      fields: {
        Work_Item__c: workItem.Id,
        Item_Status__c: 'Verified',
        Description__c: Notes,
        Date__c: new Date(),
        User__c: $rootScope.user.Name
      }
    });
    localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
        console.log("Update Saved");
        $scope.markCompleteNotes = undefined;
      },
      function(error) {
        console.log(error);
      });
    //console.log(workItemIndex,groupIndex);
    if (workItem.Status__c == 'Deficient') {
      $rootScope.currentGroup.countDeficient--;
    } else if (workItem.Status__c == 'Completed') {
      $rootScope.currentGroup.countCompleted--;
    }
    $rootScope.currentGroup.countVerified++;
    //$rootScope.showLoading();
    for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
      if ($rootScope.workItemsArray[i].Id == workItem.Id) {
        $rootScope.workItemsArray[i].Status__c = 'Verified';
        break;
      }
    }

    for (var i = 0; i < $rootScope.currentGroups.length; i++) {
      for (var j = 0; j < $rootScope.currentGroups[i].WorkItems.length; j++) {
        if ($rootScope.currentGroups[i].WorkItems[j].Id == workItem.Id) {
          $rootScope.currentGroups[i].WorkItems[j].Status__c = 'Verified';
          break;
        }
      }
    }

    localforage.setItem('WorkItems', $rootScope.workItemsArray).then(function() {
        console.log("All WorkItems Saved!");
        $rootScope.assembleJobsAndCalculate();
      },
      function(error) {
        //console.log(error);
        console.log(error);
      });
    $ionicScrollDelegate.scrollTop(false);
    $scope.activeGroups = $scope.filterGroupWorkItems($rootScope.activeFilter);
    var notificationPopup = $ionicPopup.alert({
      title: "Work Item Status Changed",
      template: "Work Item Marked As Verified"
    }).then(function(res) {
      $scope.isOpen();
      //$scope.setAspectRatio();
    });


  };
  // TO FIND DEVICE

  $rootScope.toggleContentShow = true;


  // IONIC SLIDER FOR IMAGES IN EACH GROUP AND WORK ITEMS



  var intervalId = $interval(function() {
    $ionicSlideBoxDelegate.update();
  });
  $scope.prevSlide = function() {
    $ionicSlideBoxDelegate.$getByHandle('workItem_slider').previous();
  };
  $scope.nextSlide = function() {
    $ionicSlideBoxDelegate.$getByHandle('workItem_slider').next();
  };
  $scope.groupPrevSlide = function() {
    $ionicSlideBoxDelegate.$getByHandle('group_slider').previous();
  };
  $scope.groupNextSlide = function() {
    $ionicSlideBoxDelegate.$getByHandle('group_slider').next();
  };

  $scope.prevAfterPhotoSlide = function() {
    $ionicSlideBoxDelegate.$getByHandle('AfterPhoto').previous();
  };
  $scope.nextAfterPhotoSlide = function() {
    $ionicSlideBoxDelegate.$getByHandle('AfterPhoto').next();
  };
  $scope.prevImageSlide = function(index) {
    if(index > 0){
      var prevIndex = index - 1;
      var imageId = '#rotateImage'+prevIndex;
      $scope.photoDoc[index].imageScale = 1.0;
      var currentImgId = '#sliderImage'+index;
      $scope.zoomScale(currentImgId,$scope.photoDoc[index].imageScale);
      $scope.rotateElement(imageId,$scope.photoDoc[prevIndex].Photo_Rotation__c);
      console.log("prev rotation",$scope.photoDoc[prevIndex].Photo_Rotation__c);
      //$scope.saveRotation($scope.photoDoc[index]);
      $ionicSlideBoxDelegate.previous();
    }

  };
  $scope.nextImageSlide = function(index) {
      var nextIndex = index + 1;
      var imageId = '#rotateImage'+nextIndex;
      $scope.photoDoc[index].imageScale = 1.0;
      var currentImgId = '#sliderImage'+index;
      $scope.zoomScale(currentImgId,$scope.photoDoc[index].imageScale);
      $scope.rotateElement(imageId,$scope.photoDoc[nextIndex].Photo_Rotation__c);
      console.log("next rotation",$scope.photoDoc[nextIndex].Photo_Rotation__c);
      //$scope.saveRotation($scope.photoDoc[index]);
      $ionicSlideBoxDelegate.next();
  };

  $scope.showSliderModal = function(templateUrl) {
    $ionicModal.fromTemplateUrl(templateUrl, {
      scope: $scope,
      animation: 'slide-in-up',
      backdropClickToClose: 'false'
    }).then(function(slidermodal) {
      $scope.imageModal = slidermodal;
      $scope.imageModal.show();
    });
  };

  $scope.openModal = function(sliderPhotos,beforeIndex, typeFilter) {
    //$scope.sliderPhotos = [];
    $scope.showSliderModal('app/sliderImageModal.html');
    $ionicSlideBoxDelegate.slide(beforeIndex);
    $scope.photoDoc = [];
    $scope.group_document_data = []
    $scope.modalActiveIndex = beforeIndex;
    $scope.filterCriteria = typeFilter;
    for (var m = 0; m < sliderPhotos.length; m++) {
      if(sliderPhotos[m].Document_Type__c == typeFilter){
        sliderPhotos[m].imageScale = 1.0;
        if(!sliderPhotos[m].Photo_Rotation__c){
          sliderPhotos[m].Photo_Rotation__c = 0;
          $scope.photoDoc.push(sliderPhotos[m]);
        }
        else{
          $scope.photoDoc.push(sliderPhotos[m]);
        }

      }
    }
    console.log("photo Doc",$scope.photoDoc);
    var imageId = '#rotateImage'+beforeIndex;
    var scaleImageId = '#sliderImage'+beforeIndex;
    //$scope.rotateElement(imageId,$scope.photoDoc[beforeIndex].Photo_Rotation__c);

    console.log("Function called");

    $timeout(function() {
      var element2 = jQuery(imageId);
      var r = 'rotate(' + $scope.photoDoc[beforeIndex].Photo_Rotation__c + 'deg)';
      console.log("Executed but disgusting!");
      element2.css({
        '-moz-transform': r,
        '-webkit-transform': r,
        '-o-transform': r,
        '-ms-transform': r
      });
    },100);


    console.log("image rotation",$scope.photoDoc[beforeIndex].Photo_Rotation__c);
    $scope.zoomScale(scaleImageId,$scope.photoDoc[beforeIndex].imageScale);
  };

  $scope.saveRotation = function(documentData){
    if (!angular.isNumber(documentData.Id)) {
        $rootScope.updateQueue.push({
            type: 'Property_Document__c',
            fields: {
                Id: documentData.Id,
                Photo_Rotation__c: documentData.Photo_Rotation__c
            }
        });
        localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
                console.log("Update Saved");
            },
            function(error) {
                console.log(error);
            });
    }

    if (documentData.Work_Item__c) {
        console.log("WorkItem Photo");
        for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
            if ($rootScope.workItemsArray[i].Id == documentData.Work_Item__c) {
                for (var j = 0; j < $rootScope.workItemsArray[i].Property_Documents__r.records.length; j++) {
                    if ($rootScope.workItemsArray[i].Property_Documents__r.records[j].Id == documentData.Id) {
                      console.log("WorkItem rotation one",documentData.Photo_Rotation__c);
                        $rootScope.workItemsArray[i].Property_Documents__r.records[j].Photo_Rotation__c = documentData.Photo_Rotation__c;
                        console.log("WorkItem rotation  two",$rootScope.workItemsArray[i].Property_Documents__r.records[j].Photo_Rotation__c);
                        localforage.setItem('WorkItems', $rootScope.workItemsArray).then(function() {
                                console.log("All WorkItems Saved!");
                                $rootScope.assembleJobsAndCalculate();
                            },
                            function(error) {
                                //console.log(error);
                                console.log(error);
                            });
                        break;
                    }
                }
            }
        }
    } else if (documentData.Group__c) {
        console.log("Group Photo");
        for (var i = 0; i < $rootScope.groupsArray.length; i++) {
            if ($rootScope.groupsArray[i].Id == documentData.Group__c) {
                for (var j = 0; j < $rootScope.groupsArray[i].Property_Documents__r.records.length; j++) {
                    if ($rootScope.groupsArray[i].Property_Documents__r.records[j].Id == documentData.Id) {
                        $rootScope.groupsArray[i].Property_Documents__r.records[j].Photo_Rotation__c = documentData.Photo_Rotation__c;
                        console.log("Group Rotation",$rootScope.groupsArray[i].Property_Documents__r.records[j].Photo_Rotation__c);
                        localforage.setItem('Groups', $rootScope.groupsArray).then(function() {
                                console.log("All Groups Saved!");
                                $rootScope.assembleJobsAndCalculate();
                            },
                            function(error) {
                                //console.log(error);
                                console.log(error);
                            });
                        break;
                    }
                }
            }
        }
    }
  }

  $scope.closeModal = function() {
    $scope.imageModal.hide();
    $scope.imageModal.remove();
  };
  $scope.zoomScale = function(eId,eScale){
    var element = jQuery(eId);
    var z = 'scale(' + eScale + ')';
    element.css({
      '-ms-transform': z,
      '-moz-transform': z,
      '-webkit-transform': z,
      '-o-transform': z
    });
  };
  $scope.rotateElement = function(eId,rotation){
    var element2 = jQuery(eId);
    console.log("Function called");
    var r = 'rotate(' + rotation + 'deg)';
    element2.css({
      '-moz-transform': r,
      '-webkit-transform': r,
      '-o-transform': r,
      '-ms-transform': r
    });
  };

  $scope.zoomModal = function(index) {
    var imageId = '#sliderImage'+index;
    console.log("image zoom in id",imageId);
    console.log("image zoom in scale", $scope.photoDoc[index].imageScale);
      $scope.photo_zoom_scale = $scope.photoDoc[index].imageScale + 0.3;
      $scope.zoomScale(imageId,$scope.photo_zoom_scale);
      $scope.photoDoc[index].imageScale = $scope.photo_zoom_scale;
  };

  $scope.minusModal = function(index) {
    var imageId = '#sliderImage'+index;
    console.log("image zoom out id",imageId);
    console.log("image zoom out scale", $scope.photoDoc[index].imageScale);
    if($scope.photoDoc[index].imageScale >1.0){
      $scope.photo_zoom_scale = $scope.photoDoc[index].imageScale - 0.3;
      $scope.zoomScale(imageId,$scope.photo_zoom_scale);
      $scope.photoDoc[index].imageScale = $scope.photo_zoom_scale;
    }
  };

  $scope.rotateClockWise = function(index) {
    var imageId = '#rotateImage'+index;
    $scope.Photo_Rotation = $scope.photoDoc[index].Photo_Rotation__c + 90;
    $scope.rotateElement(imageId,$scope.Photo_Rotation);
    $scope.photoDoc[index].Photo_Rotation__c = $scope.Photo_Rotation;
    $scope.saveRotation($scope.photoDoc[index]);
  };

  $scope.rotateAntiClockWise = function(index) {
    var imageId = '#rotateImage'+index;
    $scope.Photo_Rotation = $scope.photoDoc[index].Photo_Rotation__c - 90;
    $scope.rotateElement(imageId,$scope.Photo_Rotation);
    $scope.photoDoc[index].Photo_Rotation__c = $scope.Photo_Rotation;
    $scope.saveRotation($scope.photoDoc[index]);
  }

  $scope.testCamera = function(workItemId){
        $state.go('camera',{workItemId:workItemId});
        $rootScope.currentWorkItemId = workItemId;
        console.log('Current work item', workItemId);
  };

  // TAKE IMAGE FROM CAMERA
  $scope.takePhoto = function() {
    var workItemId = $scope.currentWorkItem.Id;
    var options = {
      quality: 50,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: true,
      encodingType: Camera.EncodingType.JPEG,
      targetWidth: 500,
      targetHeight: 500,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: true
    };

    $cordovaCamera.getPicture(options).then(function(imageData) {
      console.log("Image Data",imageData.length);
      $cordovaFile.readAsDataURL(cordova.file.tempDirectory,imageData.split('/').pop()).then(function(dataURI){
        console.log("Perhaps it is the dataURI",dataURI);
      $scope.imgURI = dataURI;
      console.log("Image Uri",$scope.imgURI.length);
      if (!$scope.images)
        $scope.images = [];
      $scope.images.push($scope.imgURI);
      console.log("Camera Image");
      for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
        if ($rootScope.workItemsArray[i].Id == workItemId){
          if($scope.imgURI)
          $rootScope.workItemsArray[i].Property_Documents__r.records.push({
            Id: Date.now(),
            Photo_Rotation__c: 0,
            Work_Item__c: workItemId,
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
          Work_item__c: workItemId,
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

      });

    }, function(err) {
      console.log(err);
      alert(err);
    });
    $cordovaCamera.cleanup().then(function(){
      console.log("Cleanup Success");
    });
    $scope.getCurrentWorkItemData(workItemId, 'isOpen');
    //$scope.isOpen();
    console.log("Take Photo");
  };

  //  CHOOSE FILE FROM GALLERY
  $scope.thumbnail = {
    dataUrl: 'adsfas'
  };
  $scope.fileReaderSupported = window.FileReader != null;

  $scope.selectImage = function(files) {
    var workItemId = $scope.currentWorkItem.Id;
    console.log($scope.currentWorkItem);
    $scope.workItemImage = '';
    if (files != null) {
      var file = files[0];
      if ($scope.fileReaderSupported && file.type.indexOf('image') > -1) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = function(e) {
          $scope.thumbnail.dataUrl = e.target.result;
          $scope.imgURI = $scope.thumbnail.dataUrl;
          //console.log($scope.imgURI);
          if (!$scope.images)
            $scope.images = [];
          $scope.images.push($scope.imgURI);
          for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
            if ($rootScope.workItemsArray[i].Id == workItemId) {
              $rootScope.workItemsArray[i].Property_Documents__r.records.push({
                Id: Date.now(),
                Photo_Rotation__c: 0,
                Work_Item__c: workItemId,
                Property__c: $rootScope.activeJob.Repair_Project__r.Property__r.Id,
                Document_Group__c: 'Rehab',
                Document_Type__c: 'Rehab Photo - After',
                File_URL__c: $scope.imgURI
              });

              break;
            }
          }
          console.log($rootScope.activeJob.Repair_Project__r.Property__r.Id);
          $rootScope.updateQueue.push({
            type: 'Property_Document__c',
            isNew: true,
            attachment: {
              Body: $scope.imgURI
            },
            fields: {
              Photo_Rotation__c: 0,
              Work_item__c: workItemId,
              Property__c: $rootScope.activeJob.Repair_Project__r.Property__r.Id,
              Document_Group__c: 'Rehab',
              Document_Type__c: 'Rehab Photo - After'
            }
          });
          localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
              console.log("Update Saved");
            },
            function(error) {
              console.log(error);
            });
          localforage.setItem('WorkItems', $rootScope.workItemsArray).then(function() {
              console.log("All WorkItems Saved!");
              $rootScope.assembleJobsAndCalculate();
            },
            function(error) {
              //console.log(error);
              console.log(error);
            });
          $scope.getCurrentWorkItemData(workItemId, 'isOpen');
          //$scope.isOpen();
        }
      }
    }

  };

  // ADD CREDIT MODAL

  $scope.showCreditModal = function(group, work_Item_Id, $event) {
    if($event){
      $event.stopPropagation();
      $event.preventDefault();
    }
    $scope.groupData = group;
    //console.log("Array",$rootScope.workItemsArray);
    angular.forEach($rootScope.workItemsArray, function(workItem) {
      if (workItem.Id == work_Item_Id) {
        $scope.workItemData = angular.copy(workItem);
        //console.log($scope.workItemData);
      }
    });
    $scope.amounts = [{
      name: '0%',
      value: '0'
    }, {
      name: '10%',
      value: '10'
    }, {
      name: '20%',
      value: '20'
    }, {
      name: '30%',
      value: '30'
    }, {
      name: '40%',
      value: '40'
    }, {
      name: '50%',
      value: '50'
    }, {
      name: '60%',
      value: '60'
    }, {
      name: '70%',
      value: '70'
    }, {
      name: '80%',
      value: '80'
    }, {
      name: '90%',
      value: '90'
    }, {
      name: '100%',
      value: '100'
    }];
    var option = $scope.amounts;
    $scope.showModal('app/addCredit.html');
    //$scope.isOpenWorkItem(123);
  };

  $scope.showModal = function(templateUrl) {
    $ionicModal.fromTemplateUrl(templateUrl, {
      scope: $scope,
      animation: 'slide-in-up',
      backdropClickToClose: 'false'
    }).then(function(modalOne) {
      $scope.modalOne = modalOne;
      $scope.modalOne.show();
    });
  };

  // Close the modal
  $scope.closeCreditModal = function() {
    $scope.modalOne.hide();
    $scope.modalOne.remove();
  };
  $scope.credit_data = {
    payable: '',
    remaining: '',
    creditNotes: '',
    radio: '',
    Expected_Cost: ''
  };

  $scope.clearCredit = function() {
    $scope.credit_data = {};
    $scope.workItemData.Followup_Type__c = undefined;
    $scope.form = {
      percent: $scope.amounts[0].value
    };
  };

  $scope.saveCredit = function(creditdata) {
    var str = '';
    var remaning_work_needs_bid = false;
    if (creditdata.radio == 'leaveAsIs')
      str = 'Leave As Is';
    else if (creditdata.radio == 'needsBid')
    {
        remaning_work_needs_bid = true;
        str = 'Needs Bid';
    }
    else if (creditdata.radio == 'expectedCost')
      str = 'Expected Cost';
    console.log("cost status", str);
    if ((creditdata.radio && creditdata.payable > 0) || creditdata.payable === undefined) {
      if (creditdata.radio != 'expectedCost' || (creditdata.radio == 'expectedCost' && creditdata.Expected_Cost)) {
        $rootScope.updateQueue.push({
          type: 'Work_item__c',
          fields: {
            Id: $scope.workItemData.Id,
            Credit__c: creditdata.payable,
            Credit_Notes__c: creditdata.creditNotes,
            Followup_Type__c: str,
            Remaining_Work_Needs_Bid__c: remaning_work_needs_bid,
            Remaining_Work_Cost_Est__c: creditdata.Expected_Cost
          }
        });
        localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
            console.log("Update Saved");
          },
          function(error) {
            console.log(error);
          });
        for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
          if ($rootScope.workItemsArray[i].Id == $scope.workItemData.Id) {
            $rootScope.workItemsArray[i].Credit__c = creditdata.payable;
            $rootScope.workItemsArray[i].Credit_Notes__c = creditdata.creditNotes;
            $rootScope.workItemsArray[i].Net_Amount__c = creditdata.remaining;
            $rootScope.workItemsArray[i].Followup_Type__c = str;
            $rootScope.workItemsArray[i].Remaining_Work_Needs_Bid__c = remaning_work_needs_bid;
            $rootScope.workItemsArray[i].Remaining_Work_Cost_Est__c = creditdata.Expected_Cost;
            break;
          }
        }
        localforage.setItem('WorkItems', $rootScope.workItemsArray).then(function() {
            console.log("All WorkItems Saved!");
            $rootScope.assembleJobsAndCalculate();
          },
          function(error) {
            console.log(error);
          });
        $ionicScrollDelegate.scrollTop(false);
        //$scope.filterGroupWorkItems();
        var notificationPopup = $ionicPopup.alert({
          title: 'Save Successful',
          template: "Credit information has been saved"
        });
      } else {
        var EcNotificationPopup = $ionicPopup.alert({
          title: 'Warning!',
          template: "Please enter an Estimated Amount before saving."
        });
      }
    } else {
      var creditNotificationPopup = $ionicPopup.alert({
        title: 'Warning!',
        template: "Please select a Cost to Finish option before saving."
      });
    }
  };

  $scope.setAspectRatio = function(){
    var element = jQuery('.sliderBox');
    var width = jQuery('.col-sm-6').width();
    console.log("Width",width);
    element.css({
      'width':width + 'px',
      'height':width +'px'
    });
      $timeout(function () {
      jQuery('.sliderPhoto').css({
        'width':width-40 + 'px',
        'height':'auto'
      });
      var topHeight = width/2;
      jQuery('.buttonTop').css({
        top:topHeight-20 + 'px'
      });
    }, 100);
  }

  $scope.getCurrentWorkItemData = function(workItemId, openType) {
    $scope.setAspectRatio();
    if ($rootScope.workItemBookmark == workItemId && openType == 'isNotOpen') {
      $rootScope.workItemBookmark = undefined;
      $rootScope.WiId = undefined;
      $scope.showWorkItemPhotos(workItemId);
    } else {
      $rootScope.workItemBookmark = workItemId;
      $rootScope.WiId = workItemId;
      $scope.imgURI = undefined;
      console.log(workItemId);
      $scope.showWorkItemPhotos($rootScope.WiId);
      for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
        if ($rootScope.workItemsArray[i].Id == $rootScope.WiId) {
          $scope.currentWorkItem = $rootScope.workItemsArray[i];
          break;
        }
      }
    }
  };




  $scope.workItemSlider = true;
  $scope.groupSlider = false;
  $scope.activeClass = "bgm-lightblue";

  angular.element($window).bind('resize', function () {
    $scope.setAspectRatio();
  });

  $scope.showGroupPhotos = function(group_id) {
  $scope.setAspectRatio();
    $scope.slidePhotos = [];
    for (var i = 0; i < $rootScope.groupsArray.length; i++) {
      if ($rootScope.groupsArray[i].Id == group_id) {
        $scope.property_document_data = $rootScope.groupsArray[i].Property_Documents__r.records;
        angular.forEach($scope.property_document_data, function(doc) {
          if (!doc.Work_Item__c) {
            $scope.slidePhotos.push(doc);
          }
        });
        break;

      }
    }

    $ionicSlideBoxDelegate.slide(0);
    var intervalId = $interval(function() {
      $ionicSlideBoxDelegate.update();
    });
    $scope.workItemSlider = false;
    $scope.groupSlider = true;
    $scope.defaultBgClass = "bgm-lightblue";
    $scope.activeClass = "btn-gray";
  };
  $scope.showWorkItemPhotos = function(workItem_Id) {
    $scope.setAspectRatio();
    $scope.slidePhotos = [];
    for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
      if ($rootScope.workItemsArray[i].Id == workItem_Id) {
        $scope.slidePhotos = angular.copy($rootScope.workItemsArray[i].Property_Documents__r.records);
        console.log('slidePhotos', $scope.slidePhotos);
        break;
      }
    }
    $ionicSlideBoxDelegate.slide(0);
    var intervalId = $interval(function() {
      $ionicSlideBoxDelegate.update();
    });
    $scope.workItemSlider = true;
    $scope.groupSlider = false;
    $scope.activeClass = "bgm-lightblue";
    $scope.defaultBgClass = "btn-gray";
  };
  $scope.movePhotoToGroup = function(groupId, move_workItem_photo) {
    $rootScope.updateQueue.push({
      type: 'Property_Document__c',
      fields: {
        Id: move_workItem_photo.Id,
        Work_item__c: null,
        File_URL__c: move_workItem_photo.File_URL__c,
        Group__c: groupId
      }
    });
    localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
        console.log("Update Saved");
      },
      function(error) {
        console.log(error);
      });
    var document = {};
    for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
      if ($rootScope.workItemsArray[i].Id == move_workItem_photo.Work_Item__c) {
        for (var j = 0; j < $rootScope.workItemsArray[i].Property_Documents__r.records.length; j++) {
          if ($rootScope.workItemsArray[i].Property_Documents__r.records[j].Id == move_workItem_photo.Id) {
            document = $rootScope.workItemsArray[i].Property_Documents__r.records[j];
            $rootScope.workItemsArray[i].Property_Documents__r.records.splice(j, 1);
            break;
          }
        }
      }
    }
    document.Work_Item__c = undefined;
    document.Group__c = groupId;
    for (var i = 0; i < $rootScope.groupsArray.length; i++) {
      if ($rootScope.groupsArray[i].Id == move_workItem_photo.Group__c) {
        $rootScope.groupsArray[i].Property_Documents__r.records.push(document);
        console.log('group photo moved');
        break;
      }
    }

    localforage.setItem('Groups', $rootScope.groupsArray).then(function() {
        console.log("All Groups Saved!");
      },
      function(error) {
        //console.log(error);
        console.log(error);
      });
    localforage.setItem('WorkItems', $rootScope.workItemsArray).then(function() {
        console.log("All WorkItems Saved!");
      },
      function(error) {
        //console.log(error);
        console.log(error);
      });
    var notificationPopup = $ionicPopup.alert({
      title: 'Change Successful',
      template: "Photo moved to Group"
    });
  };
  $scope.movePhotoToWorkItem = function(workItemId, move_group_photo) {
    console.log('iddd', workItemId);
    $rootScope.updateQueue.push({
      type: 'Property_Document__c',
      fields: {
        Id: move_group_photo.Id,
        File_URL__c: move_group_photo.File_URL__c,
        Work_item__c: workItemId,
        Group__c: null
      }
    });
    localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
        console.log("Update Saved");
      },
      function(error) {
        console.log(error);
      });

    var document = {};
    for (var i = 0; i < $rootScope.groupsArray.length; i++) {
      if ($rootScope.groupsArray[i].Id == move_group_photo.Group__c) {
        for (var j = 0; j < $rootScope.groupsArray[i].Property_Documents__r.records.length; j++) {
          if ($rootScope.groupsArray[i].Property_Documents__r.records[j].Id == move_group_photo.Id) {
            document = $rootScope.groupsArray[i].Property_Documents__r.records[j];
            $rootScope.groupsArray[i].Property_Documents__r.records.splice(j, 1);
            break;
          }
        }
      }
    }
    document.Work_Item__c = workItemId;
    document.Group__c = undefined;
    for (var i = 0; i < $rootScope.workItemsArray.length; i++) {
      if ($rootScope.workItemsArray[i].Id == move_group_photo.Work_Item__c) {
        $rootScope.workItemsArray[i].Property_Documents__r.records.push(document);
        console.log('moved');
        break;
      }
    }

    localforage.setItem('Groups', $rootScope.groupsArray).then(function() {
        console.log("All Groups Saved!");
      },
      function(error) {
        //console.log(error);
        console.log(error);
      });
    localforage.setItem('WorkItems', $rootScope.workItemsArray).then(function() {
        console.log("All WorkItems Saved!");
      },
      function(error) {
        //console.log(error);
        console.log(error);
      });

    var notificationPopup = $ionicPopup.alert({
      title: 'Change Successful',
      template: "Photo moved to Work Item"
    });
  };
  /*
  $scope.callMyFunction = function() {
    console.log("Rendered");
    $scope.showLoader = false;
  };
  $scope.showLoadingIcon = function() {
    $scope.showLoader = true;
  };
  */


});
