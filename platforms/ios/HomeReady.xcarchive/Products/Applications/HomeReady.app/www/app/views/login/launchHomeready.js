angular.module('homeready')
.controller('launchHomereadyCtrl', function($scope,$state,$cordovaDevice, $rootScope,$ionicLoading,$state,$stateParams,homereadyConfig,force) {
  $ionicLoading.show({
      template: '<ion-spinner icon="ios"></ion-spinner>',
      duration: 5000
  });
    var userMap = [];
    console.log($rootScope);
    $scope.$on('$ionicView.enter', function($event,data) {
      $rootScope.stateParams = data.stateParams;
      $rootScope.updateQueue = [];
      var id = data.stateParams.job_Id;
      console.log("StateParams",data.stateParams);
      $rootScope.user = {};
      $rootScope.user.Username = data.stateParams.userName;
      $rootScope.user.Id = data.stateParams.userId;
      $rootScope.isVerifier = false;
      if(data.stateParams.isVerifier == '1'){
        $rootScope.isVerifier = true;
      }
      $rootScope.uat = "Test";
      if (data.stateParams.isProduction == '1') {
        $rootScope.uat = "Production";
      }
      var instanceUrl = "https://"+data.stateParams.instance_url;
      $rootScope.initServer = instanceUrl;
      $rootScope.webUrl = instanceUrl + '/' + data.stateParams.job_Id;
      console.log("initial Url",$rootScope.webUrl);
      var initOption = {
        accessToken: data.stateParams.access_token,
        loginURL: instanceUrl,
        instanceURL: instanceUrl,
        refreshToken: undefined
      }
      //console.log(initOption);


      var saveJobAccessHistory = function(jobId) {
          var deviceID = $cordovaDevice.device.uuid;
          var userID = data.stateParams.userId;
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

        if(data.stateParams.isPortalUser == "1") {
          if (data.stateParams.isProduction == "1") {
            initOption.instanceURL = homereadyConfig.productionURL;
            initOption.loginURL = homereadyConfig.productionURL;
            $rootScope.webUrl = initOption.instanceURL + '/' + data.stateParams.job_Id;
            $rootScope.initServer = homereadyConfig.productionURL;
            console.log("Is Production Url",$rootScope.webUrl);
            //console.log($rootScope.webUrl);
          }
          else {
            initOption.instanceURL = homereadyConfig.testCommunityURL;
            initOption.loginURL = homereadyConfig.testCommunityURL;
            $rootScope.initServer = homereadyConfig.testCommunityURL;
            $rootScope.webUrl = initOption.instanceURL + '/' + data.stateParams.job_Id;
            console.log("is not Production Url",$rootScope.webUrl);
          }
        }
        //console.log($rootScope.webUrl);


        //force.tokenAuthentication(initOption);
        force.init(initOption);
        if (force.isAuthenticated()) {
          $rootScope.loginWithStateParams(data.stateParams.job_Id).then(function() {
            var count = 0;
            $rootScope.activeProjects = $rootScope.JobArray[0].Job;
            console.log($rootScope.activeProjects);
            angular.forEach($rootScope.activeProjects,function(job) {
              if (job.Id.includes(data.stateParams.job_Id)) {
                $rootScope.activeJob = job;
                $rootScope.backupJob = job;
                console.log(job);
                $rootScope.activeJobIndex = job.JobIndex;
                $rootScope.activeJobArrayIndex = job.JobArrayIndex;
                saveJobAccessHistory(job.Id);
              }
              count++;
            });
            $rootScope.activeJobs = [];
            $rootScope.activeJobs.push($rootScope.activeJob);

            $state.go('summary');
            $ionicLoading.hide();
          });
        }




    });




})
