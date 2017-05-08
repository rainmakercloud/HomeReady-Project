var homeReady = angular.module('homeready', ['ionic', 'ionic.native', 'ui.bootstrap.modal', 'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ngIdle'])
  .run(function($ionicPlatform, $state, $q, homereadyConfig, $timeout, $rootScope, force, $cordovaDevice, $ionicLoading, Idle, $cordovaNetwork) {
    $ionicPlatform.ready(function() {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      };
      //console.log(homereadyConfig);
      $cordovaNetwork.onDisconnect().subscribe(function() {
        $rootScope.isOnline = false;
        $rootScope.outSync = true;
        $rootScope.inSync = false;
        $rootScope.syncing = false;
        Idle.unwatch();
        console.log('Now Offline');
      });
      $cordovaNetwork.onConnect().subscribe(function() {
        $rootScope.isOnline = true;
        if ($rootScope.toggleSync) {
          Idle.watch();
        }
        console.log('Now Back Online');
      });

      var initDB = function() {
        try {
          localforage.defineDriver(window.cordovaSQLiteDriver).then(function() {
            return localforage.setDriver([
              window.cordovaSQLiteDriver._driver,
              localforage.INDEXEDDB,
              localforage.WEBSQL,
              localforage.LOCALSTORAGE
            ]);
          });
        } catch (e) {
          console.log(e);
        }
      }
      initDB();

      $rootScope.showLoading = function() {
        $ionicLoading.show({
          template: '<ion-spinner icon="ios"></ion-spinner>',
          duration: 1000
        });
      };

      $rootScope.hideLoading = function() {
        $ionicLoading.hide();
      };


      $rootScope.isOnline = true;
      $rootScope.lastSyncDate;
      $rootScope.isVerifier = false;
      $rootScope.walkThrough = false;
      $rootScope.menuOverlay = false;

      $rootScope.logout = function() {
        force.logout();
        localforage.setItem('User', {}).then(function() {
          console.log("User Removed!");
        }, function(error) {
          console.log(error);
        });
        $state.go('login');
      };

      $rootScope.outSync = false;
      $rootScope.inSync = false;
      $rootScope.syncing = false;
      $rootScope.toggleSync = false;

      $rootScope.count = {
        Verified: 0,
        Deficient: 0,
        Underway: 0,
        Completed: 0
      };
      $rootScope.percent = {
        Verified: 0,
        Deficient: 0,
        Underway: 0,
        Completed: 0
      };

      $rootScope.toggleSyncFunc = function() {
        if ($rootScope.toggleSync) {
          Idle.unwatch();
          $rootScope.toggleSync = false;
          $rootScope.outSync = true;
          $rootScope.inSync = false;
          $rootScope.syncing = false;
        } else {
          $rootScope.toggleSync = true;
          if ($rootScope.isOnline) {
            Idle.watch(); //It starts watch for device being idle for x(homereadyConfig) seconds
          }
        }
      };
      console.log("Device ID: " + $cordovaDevice.device.uuid);
      $rootScope.updateQueue = [];
      var JobIds = "";
      var GroupIds = "";
      var WorkIds = "";
      var ProductIds = "";

      $rootScope.loginWithStateParams = function(JobId) {
        var defer = $q.defer();
        force.query("select id,Repair_Project__c from Job_or_Order__c where id = '" + JobId + "'")
          .then(function(jobData) {
            var projectId = jobData.records[0].Repair_Project__c;
            force.query("select id, (select id from Jobs_or_Orders__r) from Repair_Project__c where id = '" + projectId + "'")
              .then(function(projectData) {
                angular.forEach(projectData.records[0].Jobs_or_Orders__r.records, function(jobInProject) {

                  if (JobIds == "") {
                    JobIds = "'" + jobInProject.Id + "'";
                  } else {
                    JobIds += ",'" + jobInProject.Id + "'";
                  }
                });
                getJobs().then(function() {
                  getGroups().then(function() {
                    getWorkItems().then(function() {
                      $rootScope.assembleJobsAndCalculate().then(function() {
                        defer.resolve();
                      });
                    });
                  });
                });
              });
          });
        return defer.promise;
      };

      var getSyncRequests = function() {
        var defer = $q.defer();
        JobIds = "";
        var userId = force.getUserId();
        var deviceID = $cordovaDevice.device.uuid;
        //console.log(userId, deviceID);
        force.query("select id,Active__c,Device_Id__c,Job_or_Order__c from Sync_Request__c where CreatedBy.Id = '" + userId + "' AND ( Device_Id__c = null OR Device_Id__c ='" + deviceID + "')")
          .then(function(SyncRequests) {
            //console.log(SyncRequests);
            angular.forEach(SyncRequests.records, function(SyncRequest) {
              if (JobIds == "") {
                JobIds = "'" + SyncRequest.Job_or_Order__c + "'";
              } else {
                JobIds += ",'" + SyncRequest.Job_or_Order__c + "'";
              }
              if (deviceID)
                if (!SyncRequest.Device_Id__c)
                  $rootScope.updateQueue.push({
                    type: 'Sync_Request__c',
                    fields: {
                      Id: SyncRequest.Id,
                      Device_Id__c: deviceID
                    }
                  });
            });
            if (JobIds != "") {
              localforage.setItem('SyncRequests', SyncRequests.records).then(function() {
                defer.resolve();
                console.log("Sync Okay!");
              }, function(error) {
                defer.reject(error);
                console.log(error);
              });
            } else {

              localforage.setItem('Jobs', '').then(function() {
                //defer.resolve();
                console.log("Jobs Removed!");
              }, function(error) {
                //defer.reject(error);
                console.log(error);
              });
              localforage.setItem('WorkItems', '').then(function() {
                //defer.resolve();
                console.log("WorkItems Removed!");
              }, function(error) {
                //defer.reject(error);
                console.log(error);
              });
              localforage.setItem('Groups', '').then(function() {
                //defer.resolve();
                console.log("Groups Removed!");
              }, function(error) {
                //defer.reject(error);
                console.log(error);
              });
              localforage.setItem('GroupsAndWorkItems', '').then(function() {
                //defer.resolve();
                console.log("GroupsAndWorkItems Removed!");
              }, function(error) {
                //defer.reject(error);
                console.log(error);
              });
              localforage.setItem('JobArray', '').then(function() {
                //defer.resolve();
                console.log("JobArray Removed!");
              }, function(error) {
                //defer.reject(error);
                console.log(error);
              });
              localforage.setItem('count', '').then(function() {
                //defer.resolve();
                console.log("Count Removed!");
              }, function(error) {
                //defer.reject(error);
                console.log(error);
              });
              localforage.setItem('percent', '').then(function() {
                //defer.resolve();
                console.log("Percent Removed!");
              }, function(error) {
                //defer.reject(error);
                console.log(error);
              });
              defer.reject("No Jobs for this Device!", JobIds, SyncRequests);
              $rootScope.workItemsArray = [];
              $rootScope.JobArray = [];
              $rootScope.groupsArray = [];
              $rootScope.count = {};
              $rootScope.percent = {};
            }
          });
        return defer.promise;
      };

      var getJobs = function() {
        var defer = $q.defer();
        //console.log(JobIds);
        if (JobIds)
          force.query("select id,CreatedDate,name,Property_Address_link__c,Original_Approved_Cost__c,Job_or_Order__c,Contracted_Completion_Date__c,Expected_Completion_Date__c,Start_Date__c,Vendor_Contact__c,Change_Order__c,Contact_LU__c,Contact_LU__r.Name,Record_Count__c,Project_Type__c,Street_Address__c,Lat_Long__c,Services_and_Supplies__r.Name,Status__c,Property__c,Repair_Project__r.Property__r.Id,(select id,createdDate, createdBy.Name,Job_or_Order__c,File_URL__c,Photo_Rotation__c from Property_Documents__r where Document_Type__c = 'Property Photo' limit 1) from Job_or_Order__c where Payment_Status__c != 'Fully Paid' AND id in (" + JobIds + ")")
          .then(function(Jobs) {
            for (var i = 0; i < Jobs.records.length; i++) {
              Jobs.records[i].JobNumber = i;
            }
            localforage.setItem('Jobs', Jobs.records).then(function() {
              defer.resolve();
              console.log("Jobs Okay!");
            }, function(error) {
              defer.reject(error);
              console.log(error);
            });
          });
        return defer.promise;
      };

      var liveUpdate = function() {
        //console.log($rootScope.activeJob);
      };

      var getGroups = function() {
        var defer = $q.defer();
        GroupIds = "";
        //console.log(JobIds);
        if (JobIds)
          force.query("select id,name,Group_Name__c,Verify_in_HomeReady__c,Type__c,Job_or_Order__c,Sequence__c,(select id,createdDate, createdBy.Name,Group__c,File_URL__c,Photo_Rotation__c,Document_Type__c,Work_Item__c from Property_Documents__r where Document_Type__c = 'Rehab Photo - Before' or Document_Type__c = 'Rehab Photo - After') from Group__c where Job_or_Order__c in (" + JobIds + ")")
          .then(function(Groups) {
            console.log("to  display nme", Groups);
            angular.forEach(Groups.records, function(group) {
              if (GroupIds == "") {
                GroupIds = "'" + group.Id + "'";
              } else {
                GroupIds += ",'" + group.Id + "'";
              }
            });
            if (Groups.records.length > 0) {
              for (var i = 0; i < Groups.records.length; i++) {
                if (Groups.records[i].Property_Documents__r === null) {
                  Groups.records[i].Property_Documents__r = {};
                  Groups.records[i].Property_Documents__r.records = [];
                }
              }
              $rootScope.groupsArray = Groups.records;
              localforage.setItem('Groups', Groups.records).then(function() {
                defer.resolve();
                console.log("Groups Okay!");
              }, function(error) {
                defer.reject(error);
                console.log(error);
              });
            } else {
              defer.reject("No Groups for current Jobs!");
              alert("No Groups for current Jobs!");
            }
          });
        return defer.promise;
      };

      var getWorkItems = function() {
        var defer = $q.defer();
        if (GroupIds)
          force.query("select id,name,Amount__c,Status__c,Note__c,Comments__c,Description__c,Item_Name__c,Group__c,Verify_in_HomeReady__c,Credit__c,Net_Amount__c,Credit_Notes__c,Remaining_Work_Cost_Est__c,Followup_Type__c,Remaining_Work_Needs_Bid__c, (Select Work_Item__c, Item_Status__c, Description__c, Date__c, User__c From Work_Logs__r), (select id,name,Description__c,Work_Item__c,Labor__c,Price__c,Qty__c,Total__c,SKU__c from Products_Materials__r),(select id,name,CreatedDate,CreatedBy.Name,Group__c,File_URL__c,Photo_Rotation__c,Document_Type__c,Work_Item__c from Property_Documents__r where Document_Type__c = 'Rehab Photo - Before' or Document_Type__c = 'Rehab Photo - After') from Work_Item__c where Status__c != null AND Group__c in (" + GroupIds + ")")
          .then(function(WorkItems) {
            console.log("workItem created By name", WorkItems);
            if (WorkItems.records.length > 0) {
              for (var i = 0; i < WorkItems.records.length; i++) {
                if (WorkItems.records[i].Property_Documents__r === null) {
                  WorkItems.records[i].Property_Documents__r = {};
                  WorkItems.records[i].Property_Documents__r.records = [];
                }
              }
              $rootScope.workItemsArray = WorkItems.records;
              localforage.setItem('WorkItems', WorkItems.records).then(function() {
                defer.resolve();
                console.log($rootScope.workItemsArray);
              }, function(error) {
                defer.reject(error);
                console.log(error);
              });
            } else {
              defer.reject("No Work Items for current Groups!");
              alert("No Work Items for current Groups!");
            }
          });
        return defer.promise;
      };

      var pushUpdates = function() {
        var defer = $q.defer();
        var flag = true;
        localforage.getItem('updateQueue').then(function(data) {
            if (data) {
              if (data.length > 0) {

                angular.forEach(data, function(update, idx, arr) {
                  if (update.isNew) {
                    force.create(update.type, update.fields).then(function(data) {
                        console.log(update.type + " Created");
                        if (update.attachment) {
                          var attachment = {};
                          attachment.Name = "Photo - " + new Date() + ".jpg";
                          console.log("Body",attachment);
                          attachment.Body = update.attachment.Body.split(',').pop();

                          attachment.ParentId = data.id;
                          force.create("Attachment", attachment).then(function(attachedFile) {
                            console.log("Attachment Uploaded!");
                            if (attachedFile.id)
                              force.update(update.type, {
                                Id: data.id,
                                File_URL__c: $rootScope.initServer + '/servlet/servlet.FileDownload?file=' + attachedFile.id
                              }).then(function() {
                                  console.log("File URL Updated");
                                  if (idx === arr.length - 1) {
                                    $timeout(function() {
                                      defer.resolve();
                                      console.log("resolved");
                                    }, 5000);
                                  }
                                },
                                function(error) {
                                  console.log(error);
                                  flag = false;
                                  $rootScope.updateQueue.push(update);
                                  if (idx === arr.length - 1) {
                                    $timeout(function() {
                                      defer.resolve();
                                      console.log("resolved");
                                    }, 5000);
                                  }
                                });
                          }, function(error) {
                            console.log(error);
                            flag = false;
                            $rootScope.updateQueue.push(update);
                            if (idx === arr.length - 1) {
                              $timeout(function() {
                                defer.resolve();
                                console.log("resolved");
                              }, 5000);
                            }
                          });
                        }
                        if (idx === arr.length - 1) {
                          $timeout(function() {
                            defer.resolve();
                            console.log("resolved");
                          }, 5000);
                        }
                      },
                      function(error) {
                        console.log(error);
                        flag = false;
                        $rootScope.updateQueue.push(update);
                        if (idx === arr.length - 1) {
                          $timeout(function() {
                            defer.resolve();
                            console.log("resolved");
                          }, 5000);
                        }
                      });
                  } else if (update.isToDeprecate) {
                    force.query("select id from Sync_Request__c where Job_or_Order__c = '" + update.Id + "' AND CreatedById = '" + update.userID + "' AND ( Device_Id__c = null OR Device_Id__c ='" + update.deviceID + "')").then(
                      function(syncRequest) {
                        //console.log(syncRequest);
                        force.del('Sync_Request__c', syncRequest.records[0].Id).then(function() {
                            console.log('Sync Request Deleted');
                            if (idx === arr.length - 1) {
                              $timeout(function() {
                                defer.resolve();
                                console.log("resolved");
                              }, 5000);
                            }
                          },
                          function(error) {
                            console.log(error);
                            flag = false;
                            $rootScope.updateQueue.push(update);
                            if (idx === arr.length - 1) {
                              $timeout(function() {
                                defer.resolve();
                                console.log("resolved");
                              }, 5000);
                            }
                          });
                      });
                  } else {
                    force.update(update.type, update.fields).then(function() {
                        console.log(update.type + " Updated");
                        if (idx === arr.length - 1) {
                          $timeout(function() {
                            defer.resolve();
                            console.log("resolved");
                          }, 5000);
                        }
                      },
                      function(error) {
                        console.log(error);
                        flag = false;
                        $rootScope.updateQueue.push(update);
                        if (idx === arr.length - 1) {
                          $timeout(function() {
                            defer.resolve();
                            console.log("resolved");
                          }, 5000);
                        }
                      });

                  }
                });
              } else {
                $timeout(function() {
                  defer.resolve();
                  console.log("resolved");
                }, 5000);

              }
            }
          },
          function(error) {
            console.log(error);
            $timeout(function() {
              defer.resolve();
              console.log("FATAL ERROR!");
            }, 5000);
          });


        if (flag)
          $rootScope.updateQueue = [];
        localforage.setItem('updateQueue', $rootScope.updateQueue).then(function() {
            console.log("Update Saved");
          },
          function(error) {
            console.log(error);
          });


        return defer.promise;
      };

      var pullUpdates = function() {
        var defer = $q.defer();
        getSyncRequests().then(function() {
            getJobs().then(function() {
                getGroups().then(function() {
                    getWorkItems().then(function() {
                        $rootScope.lastSyncDate = new Date();
                        defer.resolve();
                      },
                      function(error) {
                        defer.reject(error);
                        console.log(error);
                      });
                  },
                  function(error) {
                    defer.reject(error);
                    console.log(error);
                  });
              },
              function(error) {
                defer.reject(error);
                console.log(error);
              });
          },
          function(error) {
            defer.reject(error);
            console.log(error);
          });
        return defer.promise;
      };

      var assembleGroupAndWorkItems = function() {
        var defer = $q.defer();
        var i, j;
        var gw = [];
        var sr = [];
        localforage.getItem('Groups').then(function(Groups) {
            gw = angular.copy(Groups);
            //console.log(gw);
            localforage.getItem('WorkItems').then(function(WorkItems) {
                //console.log(WorkItems);
                for (i = 0; i < gw.length; i++) {
                  gw[i].WorkItems = [];
                  for (j = 0; j < WorkItems.length; j++) {
                    if (gw[i].Id == WorkItems[j].Group__c)
                      gw[i].WorkItems.push(WorkItems[j]);
                  }
                }
                localforage.setItem('GroupsAndWorkItems', gw).then(function() {
                    //console.log(gw);
                    defer.resolve(gw);
                    console.log("Group And WorkItems Saved!");
                  },
                  function(error) {
                    //console.log(error);
                    defer.reject(error);
                    console.log(error);
                  });
              },
              function(error) {
                defer.reject(error);
                console.log(error);
              });
          },
          function(error) {
            defer.reject(error);
            console.log(error);
          });
        return defer.promise;
      };

      var saveData = function(Jobs, GroupsAndWorkItems) {
        var defer = $q.defer();
        //console.log(Jobs, GroupsAndWorkItems);
        for (var j = 0; j < Jobs.length; j++) {
          for (var k = 0; k < Jobs[j].Job.length; k++) {
            for (var l = 0; l < GroupsAndWorkItems.length; l++) {
              if (Jobs[j].Job[k].Id == GroupsAndWorkItems[l].Job_or_Order__c) {
                GroupsAndWorkItems[l].countVerified = 0;
                GroupsAndWorkItems[l].countDeficient = 0;
                GroupsAndWorkItems[l].countCompleted = 0;
                GroupsAndWorkItems[l].countUnderway = 0;
                for (var m = 0; m < GroupsAndWorkItems[l].WorkItems.length; m++) {
                  if (GroupsAndWorkItems[l].WorkItems[m].Verify_in_HomeReady__c) {
                    if (GroupsAndWorkItems[l].WorkItems[m].Status__c) {
                      if (GroupsAndWorkItems[l].WorkItems[m].Status__c == "Verified") {
                        Jobs[j].Job[k].countVerified++;
                        GroupsAndWorkItems[l].countVerified++;
                      } else if (GroupsAndWorkItems[l].WorkItems[m].Status__c == "Underway") {
                        Jobs[j].Job[k].countUnderway++;
                        GroupsAndWorkItems[l].countUnderway++;
                      } else if (GroupsAndWorkItems[l].WorkItems[m].Status__c == "Deficient") {
                        Jobs[j].Job[k].countDeficient++;
                        GroupsAndWorkItems[l].countDeficient++;
                      } else if (GroupsAndWorkItems[l].WorkItems[m].Status__c == "Completed") {
                        Jobs[j].Job[k].countCompleted++;
                        GroupsAndWorkItems[l].countCompleted++;
                      }
                      Jobs[j].Job[k].percentVerified = (Jobs[j].Job[k].countVerified * 100) / (Jobs[j].Job[k].countVerified + Jobs[j].Job[k].countUnderway + Jobs[j].Job[k].countDeficient + Jobs[j].Job[k].countCompleted);
                      Jobs[j].Job[k].percentDeficient = (Jobs[j].Job[k].countDeficient * 100) / (Jobs[j].Job[k].countVerified + Jobs[j].Job[k].countUnderway + Jobs[j].Job[k].countDeficient + Jobs[j].Job[k].countCompleted);
                      Jobs[j].Job[k].percentCompleted = (Jobs[j].Job[k].countCompleted * 100) / (Jobs[j].Job[k].countVerified + Jobs[j].Job[k].countUnderway + Jobs[j].Job[k].countDeficient + Jobs[j].Job[k].countCompleted);
                      Jobs[j].Job[k].percentUnderway = (Jobs[j].Job[k].countUnderway * 100) / (Jobs[j].Job[k].countVerified + Jobs[j].Job[k].countUnderway + Jobs[j].Job[k].countDeficient + Jobs[j].Job[k].countCompleted);

                    }
                  }
                  GroupsAndWorkItems[l].WorkItems[m].WorkItemIndex = m;
                  GroupsAndWorkItems[l].WorkItems[m].GroupIndex = l;
                  GroupsAndWorkItems[l].WorkItems[m].JobIndex = k;
                  GroupsAndWorkItems[l].WorkItems[m].JobArrayIndex = j;

                };
                Jobs[j].Job[k].Groups.push(GroupsAndWorkItems[l]);
                //console.log("Group Pushed");
              }
            };
            Jobs[j].Job[k].JobArrayIndex = j;
            Jobs[j].Job[k].JobIndex = k;
          }

        }
        localforage.setItem('JobArray', Jobs).then(function() {
            defer.resolve(Jobs);
            console.log("All Job Saved!");
          },
          function(error) {
            //console.log(error);
            defer.reject(error);
            console.log(error);
          });

        return defer.promise;
      };

      $rootScope.assembleJobsAndCalculate = function() {
        var defer = $q.defer();
        var Jobs = [];
        var flag = true;
        var GroupsAndWorkItems = [];
        var job = {};
        var i, j, k;
        jobDetails = {
          Street_Address__c: '',
          flag: false,
          Job: []
        };
        $rootScope.countVar = {
          Verified: 0,
          Deficient: 0,
          Underway: 0,
          Completed: 0
        };
        $rootScope.percentVar = {
          Verified: 0,
          Deficient: 0,
          Underway: 0,
          Completed: 0
        };
        assembleGroupAndWorkItems().then(function(data) {
            GroupsAndWorkItems = angular.copy(data);
            localforage.getItem('Jobs').then(function(AllJobs) {
                //console.log(AllJobs);
                //console.log(GroupsAndWorkItems);
                angular.forEach(AllJobs, function(jobObj) {
                  flag = true;
                  jobDetails = {
                    Street_Address__c: '',
                    flag: false,
                    Job: []
                  };
                  job = angular.copy(jobObj);
                  jobDetails.Street_Address__c = job.Street_Address__c;
                  if (job.Contact_LU__r)
                    job.vendor = job.Contact_LU__r.Name;
                  else
                    job.vendor = "No Vendor";
                  job.Groups = [];
                  job.countVerified = 0;
                  job.countDeficient = 0;
                  job.countCompleted = 0;
                  job.countUnderway = 0;
                  job.percentVerified = 0;
                  job.percentDeficient = 0;
                  job.percentCompleted = 0;
                  job.percentUnderway = 0;

                  var contracted_completion_date = job.Contracted_Completion_Date__c;
                  var expected_Completion_Date__c = job.Expected_Completion_Date__c;
                  var start_Date__c = job.Start_Date__c;
                  var today = new Date().toJSON().slice(0, 10);
                  var contractedCompletionDateMs = new Date(contracted_completion_date);
                  var expectedCompletionDate = new Date(expected_Completion_Date__c);
                  var startDate = new Date(start_Date__c);
                  var todayMs = new Date(today);
                  var millisecondsPerDay = 1000 * 60 * 60 * 24;
                  if (contracted_completion_date === null) {
                    job.total_contracted_days = '?';
                  } else {
                    var millisBetweenContractedDate = contractedCompletionDateMs.getTime() - todayMs.getTime();
                    var contracted_days = millisBetweenContractedDate / millisecondsPerDay;
                    var contracted_completion_days = Math.floor(contracted_days);
                    job.total_contracted_days = contracted_completion_days;
                  }
                  if (expected_Completion_Date__c === null) {
                    job.total_expected_days = '?';
                  } else {
                    var millisBetweenExpectedDate = expectedCompletionDate.getTime() - todayMs.getTime();
                    var expected_days = millisBetweenExpectedDate / millisecondsPerDay;
                    var expected_completion_days = Math.floor(expected_days);
                    job.total_expected_days = expected_completion_days;
                  }
                  if (start_Date__c === null) {
                    job.total_start_days = '?';
                  } else {
                    var millisBetweenSatrtDate = todayMs.getTime() - startDate.getTime();
                    var start_days = millisBetweenSatrtDate / millisecondsPerDay;
                    var start_date_days = Math.floor(start_days);
                    job.total_start_days = start_date_days;
                  }

                  for (i = 0; i < Jobs.length; i++) {
                    if (Jobs[i].Street_Address__c == job.Street_Address__c) {
                      Jobs[i].Job.push(job);
                      Jobs[i].flag = true;
                      flag = false;
                    }
                  }
                  if (flag) {
                    jobDetails.Job = [];
                    jobDetails.Job.push(job);
                    Jobs.push(jobDetails);
                  }
                });
                //console.log(GroupsAndWorkItems);
                angular.forEach(GroupsAndWorkItems, function(GroupAndWorkItem) {
                  angular.forEach(GroupAndWorkItem.WorkItems, function(WorkItem) {
                    if (WorkItem.Verify_in_HomeReady__c) {
                      if (WorkItem.Status__c) {
                        if (WorkItem.Status__c == "Verified") {
                          $rootScope.countVar.Verified++;
                        } else if (WorkItem.Status__c == "Underway") {
                          $rootScope.countVar.Underway++;
                        } else if (WorkItem.Status__c == "Deficient") {
                          $rootScope.countVar.Deficient++;
                        } else if (WorkItem.Status__c == "Completed") {
                          $rootScope.countVar.Completed++;
                        }
                        $rootScope.percentVar.Verified = ($rootScope.countVar.Verified * 100) / ($rootScope.countVar.Verified + $rootScope.countVar.Underway + $rootScope.countVar.Deficient + $rootScope.countVar.Completed);
                        $rootScope.percentVar.Deficient = ($rootScope.countVar.Deficient * 100) / ($rootScope.countVar.Verified + $rootScope.countVar.Underway + $rootScope.countVar.Deficient + $rootScope.countVar.Completed);
                        $rootScope.percentVar.Completed = ($rootScope.countVar.Completed * 100) / ($rootScope.countVar.Verified + $rootScope.countVar.Underway + $rootScope.countVar.Deficient + $rootScope.countVar.Completed);
                        $rootScope.percentVar.Underway = ($rootScope.countVar.Underway * 100) / ($rootScope.countVar.Verified + $rootScope.countVar.Underway + $rootScope.countVar.Deficient + $rootScope.countVar.Completed);
                      }
                    }
                  });
                });
                $rootScope.percent = $rootScope.percentVar;
                $rootScope.count = $rootScope.countVar;
                saveData(Jobs, GroupsAndWorkItems).then(function(assembledData) {
                    $rootScope.JobArray = angular.copy(assembledData);
                    //console.log($rootScope.JobArray);
                    var sliderWatch = $rootScope.$watch(angular.bind('.swiper-container', function() {
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
                    localforage.setItem('percent', $rootScope.percent).then(function() {
                        localforage.setItem('count', $rootScope.count).then(function() {
                            defer.resolve();
                            console.log("WorkItems Count Saved");
                          },
                          function(error) {
                            console.log(error);
                          });
                      },
                      function(error) {
                        console.log(error);
                      });
                  },
                  function() {
                    defer.reject(error);
                    console.log(error);
                  });

              },
              function(error) {
                defer.reject(error);
                console.log(error);
              });
          },
          function(error) {
            defer.reject(error);
            console.log(error);
          });
        return defer.promise;
      };

      $rootScope.getJobArray = function() {
        var defer = $q.defer();
        localforage.getItem('JobArray').then(function(data) {
            if (data) {
              $rootScope.JobArray = angular.copy(data);
              defer.resolve();
              console.log("All Jobs Updated");
            } else {
              if ($rootScope.isOnline) {
                $rootScope.syncing = true;
                $rootScope.inSync = false;
                $rootScope.outSync = false;
                pullUpdates().then(function() {
                    $rootScope.assembleJobsAndCalculate().then(function() {
                        if ($rootScope.toggleSync){
                          $rootScope.inSync = true;
                        }
                        else{
                          $rootScope.outSync = true;
                        }
                        $rootScope.syncing = false;
                        defer.resolve();
                      },
                      function(error) {
                        defer.reject("Assemble Failed!");
                        console.log("Assemble Failed!");
                        $rootScope.syncing = false;
                        $rootScope.outSync = true;
                      });
                  },
                  function(error) {
                    defer.reject("Pull Update Failed!");
                    console.log("Pull Update Failed!");
                    $rootScope.syncing = false;
                    $rootScope.outSync = true;
                  });
              } else {
                defer.reject("No Cache And Device Offline!");
                console.log("No Cache And Device Offline!");
                $rootScope.outSync = true;
              }
            }
          },
          function(error) {
            defer.reject(error);
            console.log(error);
          });
        return defer.promise;
      };

      var syncService = function() {
        Idle.unwatch();
        if ($rootScope.isOnline) {
          //console.log("Synchronizing!");
          $rootScope.syncing = true;
          $rootScope.inSync = false;
          $rootScope.outSync = false;
          pushUpdates().then(function() {
            if ($rootScope.stateParams) {
              $rootScope.loginWithStateParams($rootScope.stateParams.job_Id).then(function() {
                liveUpdate();
                Idle.watch();
                $rootScope.lastSyncDate = new Date();
                $rootScope.inSync = true;
                $rootScope.syncing = false;
              },
              function(error) {
                Idle.watch();
                $rootScope.syncing = false;
                $rootScope.outSync = true;
                //console.log(error);
              });
            }
            else pullUpdates().then(function() {
                $rootScope.assembleJobsAndCalculate().then(function() {
                    liveUpdate();
                    Idle.watch();
                    $rootScope.lastSyncDate = new Date();
                    $rootScope.inSync = true;
                    $rootScope.syncing = false;
                  },
                  function(error) {
                    Idle.watch();
                    $rootScope.syncing = false;
                    $rootScope.outSync = true;
                    //console.log(error);
                  });
              },
              function(error) {
                Idle.watch();
                $rootScope.syncing = false;
                $rootScope.outSync = true;
                //console.log(error);
              });
          });
        }
      };

      $rootScope.$on('IdleTimeout', function() {
        if ($rootScope.lastSyncDate) {
          var currentDate = new Date();
          var difference = ((currentDate.getTime()) - ($rootScope.lastSyncDate.getTime()));
          if (difference > homereadyConfig.syncDelay && $rootScope.syncing == false) {
            syncService();
          } else {
            //console.log("Synchronized Few Moments Ago! (" + $rootScope.lastSyncDate + ")");
          }
        } else {
          syncService();
        }
      });

      jQuery(document).ready(function() {
        jQuery('[data-toggle="popover"]').tooltip();
        var date_input = jQuery('input[name="date"]'); //our date input has the name "date"
        var container = jQuery('.bootstrap-iso form').length > 0 ? jQuery('.bootstrap-iso form').parent() : "body";
        var options = {
          format: 'mm/dd/yyyy',
          container: container,
          todayHighlight: true,
          autoclose: true,
        };
        date_input.datepicker(options);
      });
      $rootScope.user = {};
    });
  })

.config(function($ionicConfigProvider) {
  $ionicConfigProvider.views.maxCache(1);
  $ionicConfigProvider.views.swipeBackEnabled(false);
})

.config(function(IdleProvider, KeepaliveProvider, homereadyConfig) {
  IdleProvider.idle(homereadyConfig.synchronizationIdleTimeout);
  IdleProvider.timeout(homereadyConfig.synchronizationIdleCountdown);
  KeepaliveProvider.interval(10);
})


.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('login', {
      url: '/login',
      cache: true,
      templateUrl: 'app/views/login/login.html',
      controller: 'LoginCtrl'
    })
    .state('launchHomeready', {
      url: '/login/:isPortalUser/:isProduction/:instance_url/:access_token/:job_Id/:userId/:userName/:isVerifier', //access token and session id works the same.
      cache: false,
      templateUrl: 'app/views/login/login.html',
      controller: 'launchHomereadyCtrl'
    })
    .state('landing', {
      url: '/landing',
      cache: false,
      templateUrl: 'app/views/landing/landing.html',
      controller: 'LandingCtrl'
    })
    .state('summary', {
      url: '/summary',
      cache: false,
      templateUrl: 'app/views/summary/summary.html',
      controller: 'SummaryCtrl'
    })
    .state('detail', {
      url: '/detail',
      cache: false,
      templateUrl: 'app/views/detail/detail.html',
      controller: 'DetailCtrl'
    })
    .state('camera', {
      url: '/camera/:workItemId',
      cache: false,
      templateUrl: 'app/views/camera/camera.html',
      controller: 'CameraCtrl'
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
  //$locationProvider.html5Mode(true);
})
.directive('scrollSmooth',function() {
  return{
    restrict:'A',
    link:function(scope,element,attrs){
      var base = 0;
      element.bind("DOMMouseScroll mousewheel onmousewheel", function(event) {
                     var event = window.event || event;
                      var windowHeight = window.innerHeight;
                      var listHeight = element.height()+100;
                      //lodash.sumBy(element.children(), function(c) { return c.offsetWidth })
                      var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
                      //scope.$apply(function(){
                        if (-base + windowHeight <= listHeight) {
                          base+=20*delta;
                        } else {
                          if (delta>0)
                          base+=20*delta;
                        }
                        base = base>0?0:base;
                        element.children().css({'transform':'translateY('+base+'px)'});
                      //});

                            event.returnValue = false;
                             if(event.preventDefault){
                            event.preventDefault();
                             }
            });
    }
  }
})
.directive('zoom', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        console.log("element slider",element);
        scope.$watch(attrs.scale, function(zoomScale) {
          var z = 'scale(' + zoomScale + ')';
          element.css({
            '-ms-transform': z,
            '-moz-transform': z,
            '-webkit-transform': z,
            '-o-transform': z
          });
        });
      }
    }
  })
  .directive('rotate', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        scope.$watch(attrs.degrees, function(rotateDegrees) {
          console.log(rotateDegrees);
          var r = 'rotate(' + rotateDegrees + 'deg)';
          element.css({
            '-moz-transform': r,
            '-webkit-transform': r,
            '-o-transform': r,
            '-ms-transform': r
          });
        });
      }
    }
  })
