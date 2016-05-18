var app = angular.module('cors', ['ionic']);

app.controller('PopupCtrl', ['$scope', function($scope) {

	$scope.active = false;
	$scope.urls = [];
	$scope.url = '';
	$scope.exposedHeaders = '';

	chrome.storage.local.get({'active': false}, function(result) {
		$scope.active = result.active;
		$scope.$apply();

		$scope.$watch('active', function(newValue, oldValue) {
			chrome.storage.local.set({'active': $scope.active});
			chrome.extension.getBackgroundPage().reload();
		});
        //
		//$scope.$watch('exposedHeaders', function(newValue, oldValue) {
		//	chrome.storage.local.set({'exposedHeaders': $scope.exposedHeaders});
		//	chrome.extension.getBackgroundPage().reload();
		//});
        //
		//$scope.$watch('urls', function(newValue, oldValue) {
		//	chrome.storage.local.set({'urls': $scope.urls});
		//	chrome.extension.getBackgroundPage().reload();
		//});
	});
}]);

app.directive('submitOnEnter', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			$(element).on('keydown', function(e) {
				if (e.which == 13) {
					$(element).parents('.item').find('.submit-action').trigger('click');
				}
			});
		}
	};
});
