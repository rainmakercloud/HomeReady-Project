angular.module('homeready').controller('LandingCtrl', function($scope, $q, $timeout, $ionicLoading, $ionicScrollDelegate, $ionicNavBarDelegate, force, $cordovaDevice, $cordovaNetwork, $ionicPopup, $rootScope, $state) {
    $scope.$on('$ionicView.loaded', function() {
        if ($rootScope.user) {} else {
            $state.go('login');
        };

        $ionicNavBarDelegate.showBar(true);
        $rootScope.backButton = false;
        $rootScope.menuToggle = false;
        $rootScope.walkThrough = false;
        if (!$rootScope.inSync && !$rootScope.syncing) {
          $rootScope.outSync = true;
        }
        else if(!$rootScope.outSync && !$rootScope.inSync){
          $rootScope.syncing = true;
        }
        else if(!$rootScope.outSync && !$rootScope.syncing ){
          $rootScope.inSync = true;
        };
        $rootScope.reverseGroup = false;
        $rootScope.menuOverlay = false;

        $rootScope.getJobArray()
            .then(function() {
                var sliderWatch = $scope.$watch(angular.bind('.swiper-container', function() {
                    var swiper = new Swiper('.swiper-container', {
                        pagination: '.swiper-pagination',
                        effect: 'coverflow',
                        grabCursor: true,
                        centeredSlides: true,
                        slidesPerView: 'auto',
                        nextButton: '.swiper-button-next',
                        prevButton: '.swiper-button-prev',
                        keyboardControl: false,
                        coverflow: {
                            rotate: 50,
                            stretch: 0,
                            depth: 800,
                            modifier: 1,
                            slideShadows: true
                        }
                    });
                    angular.element('[data-toggle="popover"]').tooltip();
                    $timeout(function() {
                        sliderWatch();
                    }, 500);
                }));
                localforage.getItem('WorkItems').then(function(allWorkItems) {
                        $rootScope.workItemsArray = angular.copy(allWorkItems);
                        localforage.getItem('Groups').then(function(allGroups) {
                                $rootScope.groupsArray = angular.copy(allGroups);
                            },
                            function(error) {});
                    },
                    function(error) {});
                //console.log($rootScope.JobArray);
                localforage.getItem('percent').then(function(percent) {
                        $rootScope.percent = angular.copy(percent);
                        localforage.getItem('count').then(function(count) {
                                $rootScope.count = angular.copy(count);
                            },
                            function(error) {});
                    },
                    function(error) {});
            });
        if ($rootScope.user) {} else {
            $state.go('login');
        };
    });
    var saveJobAccessHistory = function(jobId) {
        var deviceID = $cordovaDevice.device.uuid;
        var userID = $rootScope.user.Id;
        var dateTime = new Date();
        var role = 'Vendor';
        if ($rootScope.isVerifier)
            role = 'Verifier';

        $rootScope.updateQueue.push({
            type: 'Job_Access_Detail__c',
            isNew: true,
            fields: {
                Device_Id__c: deviceID,
                Job_Access_Date_Time__c: dateTime,
                Role__c: role,
                User__c: userID,
                Job_or_Order__c: jobId
            }
        });
        localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
                console.log("Update Saved");
            },
            function(error) {
                console.log(error);
            });
    };



    var deviceID = $cordovaDevice.device.uuid;
    var userID = $rootScope.user.Id;
    $scope.summary = function(job, jobs) {
        //$rootScope.activeJob = angular.copy(job);
        //$rootScope.jobProject = angular.copy(jobs);
        $rootScope.activeJobIndex = job.JobIndex;
        $rootScope.activeJobArrayIndex = job.JobArrayIndex;
        $rootScope.activeJob = undefined;
        saveJobAccessHistory(job.Id);
        console.log(job.Id);
        //console.log($rootScope.jobProject);
        $state.go('summary');
    };
    var deprecateJob = function(jobId, userId, deviceId) {
        $rootScope.showLoading();
        $rootScope.updateQueue.push({
            isToDeprecate: true,
            Id: jobId,
            userID: userId,
            deviceID: deviceId
        });
        localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
                console.log("Update Saved");
            },
            function(error) {
                console.log(error);
            });
        var groups = [];
        var workItems = [];
        var jobs = [];
        localforage.getItem('Groups').then(function(savedGroups) {
                angular.forEach(savedGroups, function(group) {
                    if (group.Job_or_Order__c != jobId) {
                        groups.push(group);
                    }
                });
                localforage.getItem('WorkItems').then(function(savedWorkItems) {
                        angular.forEach(savedWorkItems, function(workItem) {
                            if (workItem.Job_or_Order__c != jobId) {
                                workItems.push(workItem);
                            }
                        });
                        localforage.setItem('Groups', groups).then(function() {
                                console.log("Groups Saved!");
                                localforage.setItem('WorkItems', workItems).then(function() {
                                        console.log("WorkItems Saved!");
                                        localforage.getItem('Jobs').then(function(savedJobs) {
                                                angular.forEach(savedJobs, function(job) {
                                                    if (job.Id != jobId) {
                                                        jobs.push(job);
                                                    }
                                                });
                                                localforage.setItem('Jobs', jobs).then(function() {
                                                        console.log("Jobs Saved!");
                                                        $rootScope.assembleJobsAndCalculate();
                                                    },
                                                    function(error) {
                                                        console.log(error);
                                                    });
                                              },
                                              function(error) {
                                                  console.log(error);
                                          });


                                    },
                                    function(error) {
                                        console.log(error);
                                    });
                            },
                            function(error) {
                                console.log(error);
                            });
                    },
                    function(error) {
                        console.log(error);
                    });
            },
            function(error) {
                console.log(error);
            });
        $rootScope.hideLoading();
    };
    $scope.deprecate = function(job) {

        var jobs = [];
        if (job) {
            var deletePopup = $ionicPopup.confirm({
                title: 'Warning!',
                template: 'Remove job "' + job.Name + '" from iPad?'
            });
            deletePopup.then(function(res) {
                if (res) {
                    localforage.getItem('Jobs').then(function(savedJobs) {
                        jobs = savedJobs;
                        jobs.splice(job.JobNumber, 1);
                        localforage.setItem('Jobs', jobs).then(function() {
                            console.log("Jobs Saved!");
                        }, function(error) {
                            console.log(error);
                        });
                    }, function(error) {
                        console.log(error);
                    });
                    deprecateJob(job.Id, userID, deviceID);
                    var popup = $ionicPopup.alert({
                        title: 'Deleted!',
                        template: 'Job Removed SuccessFully'
                    });
                    popup.then(function(res) {

                    });
                }
            });
        }

    };


})
