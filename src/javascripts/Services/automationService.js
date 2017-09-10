ngapp.service('automationService', function($rootScope, backgroundService , errorService) {
    let progress;

    let buildCallbacks = function(scope) {
        return {
            /*Prompt: function(options) {
                return scope.$root.prompt(options)
            },*/
            NavigateToElement: scope.navigateToElement,
            ShowProgress: function(options) {
                if (progress) return;
                if (!options.log) options.log = [];
                progress = options;
                $rootScope.$broadcast('openModal', 'progress', {
                    progress: progress
                });
            },
            LogMessage: function(message, level) {
                if (!progress) return;
                $rootScope.$applyAsync(function() {
                    progress.log.push({ message: message, level: level });
                });
            },
            ProgressMessage: function(msg) {
                $rootScope.$applyAsync(() =>  progress.message = msg);
            },
            AddProgress: function(num) {
                $rootScope.$applyAsync(() =>  progress.current += num);
            },
            ProgressTitle: function(title) {
                $rootScope.$applyAsync(() =>  progress.title = title);
            }
        }
    };

    let getSelectedNodes = function(scope) {
        $rootScope.$broadcast('getSelectedNodes');
        if (!scope.selectedNodes) return [];
        return scope.selectedNodes.map(function(node) {
            return {
                handle: node.handle,
                element_type: node.element_type,
                column_values: node.column_values.slice()
            }
        })
    };

    let getScriptData = function(scope) {
        return { selectedNodes: getSelectedNodes(scope) };
    };

    let cleanup = function() {
        if (progress && !progress.keepOpen) {
            $rootScope.$broadcast('closeModal');
        }
        progress = undefined;
        xelib.FreeHandleGroup();
    };

    this.runScript = function(scope, scriptFileName) {
        xelib.CreateHandleGroup();
        backgroundService.run({
            filename: scriptFileName,
            callbacks: buildCallbacks(scope),
            data: getScriptData(scope)
        }).then(cleanup, function(x) {
            cleanup();
            errorService.handleException(x);
        });
    };
});