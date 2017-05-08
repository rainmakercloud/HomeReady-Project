angular.module('homeready').controller('SummaryCtrl', function($scope, force, $cordovaDevice, $rootScope, $state, $ionicNavBarDelegate) {

    $scope.$on('$ionicView.loaded', function() {
        if ($rootScope.user) {} else {
            $state.go('login');
            $rootScope.menuOverlay = false;
        };
        jQuery('body').removeClass('sidebar-toggled');
        jQuery('.ma-backdrop').remove();
        jQuery('.sidebar, .ma-trigger').removeClass('toggled');

        $rootScope.walkThrough = true;
        $ionicNavBarDelegate.showBar(true);
        $rootScope.backButton = true;
        $rootScope.menuToggle = true;
        $rootScope.menuOverlay = true;
        if (!$rootScope.inSync && !$rootScope.syncing) {
          $rootScope.outSync = true;
        }
        else if(!$rootScope.outSync && !$rootScope.inSync){
          $rootScope.syncing = true;
        }
        else if(!$rootScope.outSync && !$rootScope.syncing ){
          $rootScope.inSync = true;
        };
        $rootScope.backToLandingView = function(){
          $state.go('landing');
        }
        $rootScope.backToState = function() {
          if(!$rootScope.iPad){
            window.open($rootScope.webUrl,"_self");
          }
          else{
            $state.go('landing');
            $rootScope.menuOverlay = false;
          }
        };
        if(!$rootScope.iPad){
          $rootScope.toggleSyncFunc();
          $rootScope.toggleSync = true;
        }

        if (!$rootScope.activeJob) {
          $rootScope.activeJob = angular.copy($rootScope.JobArray[$rootScope.activeJobArrayIndex].Job[$rootScope.activeJobIndex]);
          //console.log("active Job",$rootScope.activeJob);
          $rootScope.activeProjects = angular.copy($rootScope.JobArray[$rootScope.activeJobArrayIndex].Job);
          //console.log($rootScope.activeJob.Groups);
          $rootScope.activeJobs = [];
          $rootScope.activeJobs.push($rootScope.activeJob);
          $rootScope.backupJob = $rootScope.activeJob;
          $rootScope.changeOrders($rootScope.activeProjects, $rootScope.activeJob);
          $rootScope.includeAllJobs = false;
          $rootScope.includeChangeOrders = false;
        }
        console.log($rootScope.activeJob);
        //console.log("active projects",$rootScope.activeProjects);
        if ($rootScope.activeChangeOrders)
        if ($rootScope.activeChangeOrders.length <= 0) {
            $rootScope.showChangeOrder = false;
        } else {
            $rootScope.showChangeOrder = true;
        }

    });


    $rootScope.walkThroughFunc = function() {
        if ($rootScope.reverseGroup) {
            $rootScope.reverseGroup = false;
        } else {
            $rootScope.reverseGroup = true;
        }
    };

    var deviceID = $cordovaDevice.device.uuid;
    var backup = {};
    $rootScope.changeOrders = function(currentProjects, currentJob) {
        $rootScope.activeChangeOrders = [];
        var allChangeOrderJob = {};
        angular.forEach(currentProjects, function(currentProject) {
            if (currentProject.Change_Order__c == true) {
                if (currentProject.Job_or_Order__c == currentJob.Id) {
                    allChangeOrderJob = currentProject;
                    $rootScope.activeChangeOrders.push(allChangeOrderJob);
                }
            }
        });
    };

    var dummyJob = {};
    $rootScope.includeAllJob = function(activeJob, project, currentValue) {
      //console.log("I Active Job",activeJob);
      //console.log("I Active Projects",project);
        var flag;
        $rootScope.currentState = [];
        $rootScope.currentState = angular.copy($state.current);
        //console.log("state", $rootScope.currentState);
        if (currentValue) {
          $rootScope.newCountUnderway = 0;
          $rootScope.newCountCompleted = 0;
          $rootScope.newCountDeficient = 0;
          $rootScope.newCountVerified = 0;
            var object = {};
            object.Property_Address_link__c = activeJob.Property_Address_link__c;
            object.Services_and_Supplies__r = activeJob.Services_and_Supplies__r;
            object.Repair_Project__r = activeJob.Repair_Project__r;
            object.Project_Type__c = activeJob.Project_Type__c;
            object.vendor = activeJob.vendor;
            //console.log();
            object.Groups = angular.copy(activeJob.Groups);
            object.countVerified = activeJob.countVerified;
            object.countDeficient = activeJob.countDeficient;
            object.countUnderway = activeJob.countUnderway;
            object.countCompleted = activeJob.countCompleted;
            var startDate = new Date(activeJob.Start_Date__c);
            var amount = activeJob.Original_Approved_Cost__c;
            var dueDate = new Date(activeJob.Contracted_Completion_Date__c);
            var expDate = new Date(activeJob.Expected_Completion_Date__c);
            object.total_start_days = activeJob.total_start_days;
            object.total_contracted_days = activeJob.total_contracted_days;
            object.total_expected_days = activeJob.total_expected_days;
            $rootScope.activeJobs = [];
            angular.forEach(project, function(job) {
                $rootScope.activeJobs.push(job);
                console.log("Came here.");
                if (new Date(job.Start_Date__c) < startDate) {
                    startDate = new Date(job.Start_Date__c);
                    object.total_start_days = job.total_start_days;
                }
                if (new Date(job.Contracted_Completion_Date__c) > dueDate) {
                    dueDate = new Date(job.Contracted_Completion_Date__c);
                    object.total_contracted_days = job.total_contracted_days;
                }
                if (new Date(job.Expected_Completion_Date__c) > expDate) {
                    expDate = new Date(job.Expected_Completion_Date__c);
                    object.total_expected_days = job.total_expected_days;
                }
                if (job.Original_Approved_Cost__c && job.Id != activeJob.Id) {
                    amount += job.Original_Approved_Cost__c;
                }
                angular.forEach(job.Groups, function(group) {
                    if (job.Id != activeJob.Id) {
                      flag = false;
                      for (var g = 0; g < object.Groups.length; g++) {
                        if (group.Group_Name__c == object.Groups[g].Group_Name__c) {
                            flag = true;
                            object.Groups[g].countVerified += group.countVerified;
                            object.Groups[g].countDeficient += group.countDeficient;
                            object.Groups[g].countUnderway += group.countUnderway;
                            object.Groups[g].countCompleted += group.countCompleted;

                            object.countVerified += group.countVerified;
                            object.countDeficient += group.countDeficient;
                            object.countUnderway += group.countUnderway;
                            object.countCompleted += group.countCompleted;
                            //console.log("object.Groups[g]",objgroup);
                        }


                      }

                        //console.log("object",object);
                        if(!flag){
                          object.Groups.push(group);
                          console.log("flag false group",group);
                          object.countVerified += group.countVerified;
                          object.countDeficient += group.countDeficient;
                          object.countUnderway += group.countUnderway;
                          object.countCompleted += group.countCompleted;
                          //console.log("object flag",object);
                        }

                    }
                });
            });
            object.Start_Date__c = startDate;
            object.Contracted_Completion_Date__c = dueDate;
            object.Original_Approved_Cost__c = amount;
            object.Expected_Completion_Date__c = expDate;
            object.Name = "Multiple Jobs";
            $rootScope.activeJob = {};
            $rootScope.activeJob = object;
            if ($scope.currentState.name == "detail") {
                angular.forEach($rootScope.activeJobs, function(job) {
                    angular.forEach(job.Groups, function(group) {
                        angular.forEach($rootScope.currentGroups, function(curGroup) {
                            if (group.Group_Name__c == curGroup.Group_Name__c) {
                                $rootScope.newCountUnderway += group.countUnderway;
                                $rootScope.newCountCompleted += group.countCompleted;
                                $rootScope.newCountDeficient += group.countDeficient;
                                $rootScope.newCountVerified += group.countVerified;
                            }
                        })
                    })
                });
                $rootScope.currentGroup.countUnderway = $rootScope.newCountUnderway;
                $rootScope.currentGroup.countCompleted = $rootScope.newCountCompleted;
                $rootScope.currentGroup.countDeficient = $rootScope.newCountDeficient;
                $rootScope.currentGroup.countVerified = $rootScope.newCountVerified;
            }
        }
        else {
            $rootScope.activeJob = $rootScope.backupJob;
            $rootScope.activeJobs = [];
            $rootScope.activeJobs.push($rootScope.activeJob);
            //console.log("active Jobs",$rootScope.activeJobs);
            //console.log($rootScope.activeJobs[0].countVerified);

          if($rootScope.currentState.name == "detail"){
            if($rootScope.fromStatus){
              $rootScope.currentGroup.countVerified = angular.copy($rootScope.activeJobs[0].countVerified);
              $rootScope.currentGroup.countDeficient = angular.copy($rootScope.activeJobs[0].countDeficient);
              $rootScope.currentGroup.countCompleted = angular.copy($rootScope.activeJobs[0].countCompleted);
              $rootScope.currentGroup.countUnderway = angular.copy($rootScope.activeJobs[0].countUnderway);
            }
            else{

              angular.forEach($rootScope.activeJobs[0].Groups, function(group) {
                  angular.forEach($rootScope.currentGroups, function(curGroup) {
                      if (group.Group_Name__c == curGroup.Group_Name__c) {
                            $rootScope.currentGroups = [];
                            $rootScope.currentGroup = {};
                            $rootScope.currentGroups.push(group);
                            $rootScope.currentGroup.countVerified = group.countVerified;
                            $rootScope.currentGroup.countDeficient = group.countDeficient;
                            $rootScope.currentGroup.countCompleted = group.countCompleted;
                            $rootScope.currentGroup.countUnderway = group.countUnderway;

                      }
                  });
              });
            }

          //console.log($rootScope.currentGroup);
        }


        }
    };

    $rootScope.includeChangeOrder = function(activeJob, project, currentValue) {
        var flag;
        $rootScope.currentState = [];
        $rootScope.currentState = angular.copy($state.current);
        if (currentValue) {
          $rootScope.newCountUnderway = 0;
          $rootScope.newCountCompleted = 0;
          $rootScope.newCountDeficient = 0;
          $rootScope.newCountVerified = 0;
            var object = {};
            object.Groups = angular.copy(activeJob.Groups);
            object.Property_Address_link__c = activeJob.Property_Address_link__c;
            object.Repair_Project__r = activeJob.Repair_Project__r;
            object.Services_and_Supplies__r = activeJob.Services_and_Supplies__r;
            object.Project_Type__c = activeJob.Project_Type__c;
            object.vendor = activeJob.vendor;
            object.countVerified = activeJob.countVerified;
            object.countDeficient = activeJob.countDeficient;
            object.countUnderway = activeJob.countUnderway;
            object.countCompleted = activeJob.countCompleted;
            $rootScope.includeChangeOrders = true;
            var startDate = new Date(activeJob.Start_Date__c);
            var amount = activeJob.Original_Approved_Cost__c;
            var dueDate = new Date(activeJob.Contracted_Completion_Date__c);
            var expDate = new Date(activeJob.Expected_Completion_Date__c);
            object.total_start_days = activeJob.total_start_days;
            object.total_contracted_days = activeJob.total_contracted_days;
            object.total_expected_days = activeJob.total_expected_days;
            angular.forEach(project, function(job) {
                if (job.Job_or_Order__c === activeJob.Id) {
                    $rootScope.activeJobs.push(job);
                    if (new Date(job.Start_Date__c) < startDate) {
                        startDate = new Date(job.Start_Date__c);
                        object.total_start_days = job.total_start_days;
                    }
                    if (new Date(job.Contracted_Completion_Date__c) > dueDate) {
                        dueDate = new Date(job.Contracted_Completion_Date__c);
                        object.total_contracted_days = job.total_contracted_days;
                    }
                    if (new Date(job.Expected_Completion_Date__c) > expDate) {
                        expDate = new Date(job.Expected_Completion_Date__c);
                        object.total_expected_days = job.total_expected_days;
                    }
                    if (job.Original_Approved_Cost__c && job.Id != activeJob.Id) {
                        amount += job.Original_Approved_Cost__c;
                    }

                }
                angular.forEach(job.Groups, function(group) {
                    if (group.Job_or_Order__c != activeJob.Id) {
                      flag = false;
                      for (var j = 0; j < object.Groups.length; j++) {
                        if (group.Group_Name__c == object.Groups[j].Group_Name__c) {
                            flag = true;
                            object.Groups[j].countVerified += group.countVerified;
                            object.Groups[j].countDeficient += group.countDeficient;
                            object.Groups[j].countUnderway += group.countUnderway;
                            object.Groups[j].countCompleted += group.countCompleted;

                            object.countVerified += group.countVerified;
                            object.countDeficient += group.countDeficient;
                            object.countUnderway += group.countUnderway;
                            object.countCompleted += group.countCompleted;
                        }
                      }

                      if(!flag){
                          object.Groups.push(group);
                          object.countVerified += group.countVerified;
                          object.countDeficient += group.countDeficient;
                          object.countUnderway += group.countUnderway;
                          object.countCompleted += group.countCompleted;
                      }

                    }
                });
            });
            object.Start_Date__c = startDate;
            object.Contracted_Completion_Date__c = dueDate;
            object.Original_Approved_Cost__c = amount;
            object.Expected_Completion_Date__c = expDate;
            object.Name = "Multiple Jobs";
            $rootScope.activeJob = {};
            $rootScope.activeJob = object;
            if ($rootScope.currentState == "detail") {
            angular.forEach($rootScope.activeJobs, function(job) {
                angular.forEach(job.Groups, function(group) {
                    angular.forEach($rootScope.currentGroups, function(curGroup) {
                        if (group.Group_Name__c == curGroup.Group_Name__c) {
                            $rootScope.newCountUnderway += group.countUnderway;
                            $rootScope.newCountCompleted += group.countCompleted;
                            $rootScope.newCountDeficient += group.countDeficient;
                            $rootScope.newCountVerified += group.countVerified;
                        }
                    })
                })
            });
            $rootScope.currentGroup.countUnderway = $rootScope.newCountUnderway;
            $rootScope.currentGroup.countCompleted = $rootScope.newCountCompleted;
            $rootScope.currentGroup.countDeficient = $rootScope.newCountDeficient;
            $rootScope.currentGroup.countVerified = $rootScope.newCountVerified;
          }
        }

        else {
            $rootScope.activeJob = $rootScope.JobArray[$rootScope.activeJobArrayIndex].Job[$rootScope.activeJobIndex];
            //console.log("Done!");
            $rootScope.activeJob = $rootScope.backupJob;
            $rootScope.includeChangeOrders = false;
            $rootScope.activeJobs = [];
            $rootScope.activeJobs.push($rootScope.activeJob);
            if($rootScope.currentState.name == "detail"){
              if($rootScope.fromStatus){
                $rootScope.currentGroup.countVerified = angular.copy($rootScope.activeJobs[0].countVerified);
                $rootScope.currentGroup.countDeficient = angular.copy($rootScope.activeJobs[0].countDeficient);
                $rootScope.currentGroup.countCompleted = angular.copy($rootScope.activeJobs[0].countCompleted);
                $rootScope.currentGroup.countUnderway = angular.copy($rootScope.activeJobs[0].countUnderway);
              }
              else{
                angular.forEach($rootScope.activeJobs[0].Groups, function(group) {
                    angular.forEach($rootScope.currentGroups, function(curGroup) {
                        if (group.Group_Name__c == curGroup.Group_Name__c) {
                              $rootScope.currentGroups = [];
                              $rootScope.currentGroup = {};
                              $rootScope.currentGroups.push(group);
                              $rootScope.currentGroup.countVerified = group.countVerified;
                              $rootScope.currentGroup.countDeficient = group.countDeficient;
                              $rootScope.currentGroup.countCompleted = group.countCompleted;
                              $rootScope.currentGroup.countUnderway = group.countUnderway;

                        }
                    });
                });
              }
          }
        }
    };

    $rootScope.ChangedExpectedDate = function(expectedDate, jobId) {
        var date = new Date(expectedDate);
        $rootScope.updateQueue.push({
            type: 'Job_or_Order__c',
            fields: {
                Id: jobId,
                Expected_Completion_Date__c: date
            }
        });
        localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
                console.log("Update Saved");
            },
            function(error) {
                console.log(error);
            });
    };


    $rootScope.switchJob = function(job) {
      $rootScope.currentState = angular.copy($state.current);
      //console.log($state.current);
        $rootScope.backupJob = job;
        $rootScope.activeJobIndex = job.JobIndex;
        $rootScope.activeProjects = $rootScope.JobArray[$rootScope.activeJobArrayIndex].Job;
        //console.log("Active Projects",$rootScope.activeProjects);
        $rootScope.activeJob = $rootScope.JobArray[$rootScope.activeJobArrayIndex].Job[$rootScope.activeJobIndex];
        //console.log("Active Job",$rootScope.activeJob);

        $rootScope.changeOrders($rootScope.activeProjects, $rootScope.activeJob);
        if ($rootScope.activeChangeOrders.length <= 0) {
            $rootScope.showChangeOrder = false;
        } else {
            $rootScope.showChangeOrder = true;
        }

        $rootScope.includeAllJobs = false;
        $rootScope.includeChangeOrders = false;
        $rootScope.activeJobs = [];
        $rootScope.activeJobs.push($rootScope.activeJob);
        //console.log("Active Jobs",$rootScope.activeJobs);
        if($rootScope.currentState.name == "detail"){
          if($rootScope.fromStatus){
            $rootScope.currentGroup.countVerified = angular.copy($rootScope.activeJobs[0].countVerified);
            $rootScope.currentGroup.countDeficient = angular.copy($rootScope.activeJobs[0].countDeficient);
            $rootScope.currentGroup.countCompleted = angular.copy($rootScope.activeJobs[0].countCompleted);
            $rootScope.currentGroup.countUnderway = angular.copy($rootScope.activeJobs[0].countUnderway);
          }
          else{
            angular.forEach($rootScope.activeJobs[0].Groups, function(group) {
                angular.forEach($rootScope.currentGroups, function(curGroup) {
                    if (group.Group_Name__c == curGroup.Group_Name__c) {
                          $rootScope.currentGroups = [];
                          $rootScope.currentGroup = {};
                          $rootScope.currentGroups.push(group);
                          $rootScope.currentGroup.countVerified = group.countVerified;
                          $rootScope.currentGroup.countDeficient = group.countDeficient;
                          $rootScope.currentGroup.countCompleted = group.countCompleted;
                          $rootScope.currentGroup.countUnderway = group.countUnderway;

                    }
                });
            });
          }
        }
    };

    $scope.openMap = function(eve, LatLong, StreetAddress) {

        if (deviceID) {
            //window.open('http://maps.apple.com/?ll='+encodeURIComponent(LatLong.trim()), '_blank', 'location=no', 'hidden=yes');
            window.open('http://maps.apple.com/?address=' + encodeURIComponent(StreetAddress.trim()) + '&ll=' + encodeURIComponent(LatLong.trim()), '_blank', 'location=no,hidden=yes');
            //window.close();
        } else {
            window.open(eve.target.href, '_blank', 'location=no');
        }

    };


    $scope.gotoDetail = function(filterStr) {
      $rootScope.fromStatus = true;
        $rootScope.currentGroups = [];
        $rootScope.currentGroup = {};
        $rootScope.activeFilter = {
            Deficient: false,
            Completed: false,
            Verified: false,
            Underway: false
        };
        if (filterStr == "Underway")
            $rootScope.activeFilter.Underway = true;
        else if (filterStr == "Deficient")
            $rootScope.activeFilter.Deficient = true;
        else if (filterStr == "Completed")
            $rootScope.activeFilter.Completed = true;
        else if (filterStr == "Verified")
            $rootScope.activeFilter.Verified = true;
        $rootScope.currentGroups = angular.copy($rootScope.activeJob.Groups);
        $rootScope.currentGroup.countVerified = $rootScope.activeJob.countVerified;
        $rootScope.currentGroup.countDeficient = $rootScope.activeJob.countDeficient;
        $rootScope.currentGroup.countCompleted = $rootScope.activeJob.countCompleted;
        $rootScope.currentGroup.countUnderway = $rootScope.activeJob.countUnderway;
        $state.go('detail');
    };


    $scope.gotoDetailFilteredGroup = function(group, filter) {
      $rootScope.fromStatus = false;
        $rootScope.currentGroups = [];
        $rootScope.currentGroup = {};
        $rootScope.activeFilter = {
            Deficient: false,
            Completed: false,
            Verified: false,
            Underway: false
        };
        if (filter == "Underway")
            $rootScope.activeFilter.Underway = true;
        else if (filter == "Deficient")
            $rootScope.activeFilter.Deficient = true;
        else if (filter == "Completed")
            $rootScope.activeFilter.Completed = true;
        else if (filter == "Verified")
            $rootScope.activeFilter.Verified = true;
        $rootScope.currentGroups.push(group);
        $rootScope.currentGroup.countVerified = group.countVerified;
        $rootScope.currentGroup.countDeficient = group.countDeficient;
        $rootScope.currentGroup.countCompleted = group.countCompleted;
        $rootScope.currentGroup.countUnderway = group.countUnderway;
        //console.log(group);
        $state.go('detail', {
            reload: true
        });
    };

    $scope.gotoDetailGroup = function(group) {
      $rootScope.fromStatus = false;
        if (group.countUnderway || group.countCompleted || group.countDeficient || group.countVerified) {
            $rootScope.currentGroups = [];
            $rootScope.currentGroup = {};
            $rootScope.activeFilter = {
                Deficient: true,
                Completed: true,
                Verified: true,
                Underway: true
            };
            $rootScope.currentGroups.push(group);
            console.log(group);
            $rootScope.currentGroup.countVerified = group.countVerified;
            $rootScope.currentGroup.countDeficient = group.countDeficient;
            $rootScope.currentGroup.countCompleted = group.countCompleted;
            $rootScope.currentGroup.countUnderway = group.countUnderway;
            $state.go('detail');
        }
    };

});
