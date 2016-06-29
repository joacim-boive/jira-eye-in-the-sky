(function () {
    var $sprints = null;
    var sprints = [];
    var isActive = 0;
    var url = '';
    var labelOne = '';
    var labelTwo = '';
    var spreadSheet = '';
    var spreadSheetData = {};
    var availability = {};
    var thisMessage = null;
    var thisMessageHolder = null;
    var jiralyzer = null;
    var isSetup = false;

    var spreadSheetRowID = ['sprint', 'labelOne', 'labelTwo'];

    function debounce(fn, delay) {
        var timer = null;
        return function () {
            var context = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    }

    function init() {
        var thisSprint = {};
        var sprints = [];

        if (!$('.ghx-sprint-group > div[data-sprint-id]').size()) {
            jiralyzer.hide();
            return;
        }

        jiralyzer.show();

        thisMessageHolder.innerHTML = '<p>Loading...</p>';

        $(document).ajaxStop(function () {
            var totalTimer = '';
            var html = '';

            for (var sprintId in sprints) {
                totalTimer = '<span id="total' + sprintId + '" class="aui-badge" title="Total remaining hours, including sub-tasks">' + sprints[sprintId] + '</span>';
                $('div[data-sprint-id="' + sprintId + '"] div.ghx-badge-group.ghx-right').prepend(totalTimer);
            }

            sprints.sort(function (thisSprint, thatSprint) {
                if (thisSprint.sprintId > thatSprint.sprintId) {
                    return 1;
                }
                if (thisSprint.value < thatSprint.value) {
                    return -1;
                }
            });

            sprints.forEach(function (sprint, index) {
                html += sprint.html;
            });

            thisMessageHolder.innerHTML = html;

            isSetup = true;
        });

        $sprints.each(function getListOfSprints(index, sprint) {
            thisSprint = {};
            thisSprint.sprintId = sprint.dataset.sprintId;
            thisSprint.sprintName = sprint.childNodes[0].childNodes[1].innerText;
            thisSprint.totalHours = 0;
            thisSprint.missingLabels = 0;
            thisSprint.html = '';

            thisSprint[labelOne] = {};
            thisSprint[labelOne].count = 0;
            thisSprint[labelOne].hours = 0;

            thisSprint[labelTwo] = {};
            thisSprint[labelTwo].count = 0;
            thisSprint[labelTwo].hours = 0;

            thisSprint['hasDouble'] = {};
            thisSprint['hasDouble'].count = 0;
            thisSprint['hasDouble'].hours = 0;

            $.ajax({
                    url: url + '/rest/api/2/search',
                    type: 'GET',
                    dataType: 'json',
                    thatSprint: thisSprint,
                    spreadSheetData: spreadSheetData,
                    data: {
                        'jql': 'sprint=' + thisSprint.sprintId + ' AND type != Sub-task'
                    }
                })
                .done(function getIssuesInCurrentSprint(data) {
                    var that = this;
                    var thatSprint = that.thatSprint;
                    var html = '';
                    var labels = [];
                    var hoursForStory = 0;
                    var hoursActual = 0;
                    var hoursIncludingSubTasks = 0;
                    var key = '';
                    var $timeHolder = null;
                    var listIssue = null;
                    var issue = {};
                    var doubleLabels = [];

                    for (var z = 0, dataIssuesLen = data.issues.length; z < dataIssuesLen; z++) {
                        doubleLabels = [];

                        issue = data.issues[z];

                        labels = [];
                        hoursIncludingSubTasks = issue.fields.aggregatetimeestimate / 3600;
                        key = issue.key;
                        $timeHolder = $('div[data-issue-key="' + key + '"] span.ghx-statistic-badge');
                        listIssue = document.querySelector('a[title="' + issue.key + '"]');

                        hoursForStory = parseInt($timeHolder.text());
                        hoursActual = !hoursIncludingSubTasks ? hoursForStory : hoursIncludingSubTasks ? hoursIncludingSubTasks : 0;
                        hoursActual = hoursActual ? hoursActual : 0;
                        $timeHolder.text(hoursActual);

                        thatSprint.totalHours += hoursActual;


                        if (listIssue) {
                            for (var x = 0, labelLen = issue.fields.labels.length; x < labelLen; x++) {
                                /**
                                 * NOTE: This will count the same hours "twice" if the issue has both labelOne and labelTwo.
                                 */
                                if (issue.fields.labels[x] === labelOne) {
                                    doubleLabels.push(labelOne);

                                    thatSprint[labelOne].count++;
                                    thatSprint[labelOne].hours += hoursActual;
                                    thatSprint[labelOne].available = this.spreadSheetData[encodeURIComponent(thatSprint.sprintName)][labelOne];


                                    labels.push(labelOne);
                                }
                                if (issue.fields.labels[x] === labelTwo) {
                                    doubleLabels.push(labelTwo);

                                    thatSprint[labelTwo].count++;
                                    thatSprint[labelTwo].hours += hoursActual;
                                    thatSprint[labelTwo].available = this.spreadSheetData[encodeURIComponent(thatSprint.sprintName)][labelTwo];

                                    labels.push(labelTwo);
                                }
                            }

                            if (labels.length === 0) {
                                thatSprint.missingLabels++;
                                console.warn('Missing labels: ' + key);
                            }

                            if(doubleLabels.length > 1){
                                thatSprint['hasDouble'].count++;
                                thatSprint['hasDouble'].hours += hoursActual;
                            }

                            $(listIssue).closest('.js-issue').attr('data-labels', labels.join(','));
                        }
                    }

                    html += '<ul><li><a target="_blank" href="' + url + '/issues/?jql=sprint=' + encodeURIComponent(thatSprint.sprintId + ' and type != sub-task') + '">' +
                        thatSprint.sprintName + ' : ' + thatSprint.sprintId + '</a></li><ul>';

                    html += '<li><a target="_blank" href="' + url + '/issues/?jql=sprint=' + encodeURIComponent(thatSprint.sprintId + ' and labels in(' + labelOne + ')') + '">' +
                        labelOne + ': ' + thatSprint[labelOne].count + ' / ' + thatSprint[labelOne].hours + 'h of ' + thatSprint[labelOne].available + 'h</a>';

                    html += '<li><a target="_blank" href="' + url + '/issues/?jql=sprint=' + encodeURIComponent(thatSprint.sprintId + ' and labels in(' + labelTwo + ')') + '">' +
                        labelTwo + ': ' + thatSprint[labelTwo].count + ' / ' + thatSprint[labelTwo].hours + 'h of ' + thatSprint[labelTwo].available + 'h</a>';

                    if(thatSprint['hasDouble'].count > 0){
                        html += '<li class="warning"><a target="_blank" href="' + url + '/issues/?jql=sprint=' +
                            encodeURIComponent(thatSprint.sprintId + ' and (labels = "' + labelOne + '" and labels = "' + labelTwo + '")') + '">' + labelOne + ' & ' + labelTwo + ': ' +
                            thatSprint['hasDouble'].count + ' / ' +  thatSprint['hasDouble'].hours + 'h</a>';
                    }

                    if (thatSprint.missingLabels > 0) {
                        html += '<li class="error"><a target="_blank" href="' + url + '/issues/?jql=sprint=' + encodeURIComponent(thatSprint.sprintId + ' and (labels not in(' + labelOne + ', ' + labelTwo +
                                ') or labels is Empty) and type != sub-task') + '"><span class="hint--top hint--warning hint--bounce" aria-label="Click to show JIRAs that are missing the ' +
                            labelOne + ' & ' + labelTwo + ' label(s)">Missing labels - ' + thatSprint.missingLabels + '</span></a>'
                    }

                    html += '</ul></ul>';

                    thatSprint.html = html;

                    sprints.push(thatSprint);
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    console.log('HTTP Request Failed');
                })

        });
    }

    //function findSprintAvailabilityData(id){
    // for(var n = 0, spread)
    //}

    function messageSystem() {
        var thisId = 'jiralyzer';

        function dragStart(event) {
            var style = window.getComputedStyle(event.target, null);
            event.dataTransfer.setData('text/plain',
                (parseInt(style.getPropertyValue('left'), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue('top'), 10) - event.clientY));
        }

        function dragOver(event) {
            event.preventDefault();
            return false;
        }

        function drop(event) {
            var offset = event.dataTransfer.getData('text/plain').split(',');
            var dm = document.getElementById(thisId);

            dm.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
            dm.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';

            event.preventDefault();
            return false;
        }

        $('body').append('<aside draggable="true" id="' + thisId + '"><h1><div class="collapser"></div>JIRALyzer - Planning</h1><div class="jl-content"></div></aside>');

        jiralyzer = $('#' + thisId);

        thisMessage = document.getElementById(thisId);
        thisMessageHolder = thisMessage.querySelector('.jl-content');

        thisMessage.addEventListener('dragstart', dragStart, false);
        document.body.addEventListener('dragover', dragOver, false);
        document.body.addEventListener('drop', drop, false);
    }

    function eventHandlers() {
        jiralyzer.find('h1').on('click', function () {
            jiralyzer.toggleClass('collapsed');
        });

        var target = document.querySelector('#ghx-content-group');

// create an observer instance
        var observer = new MutationObserver(function (mutations) {
            if (!isSetup) {
                return;
            }

            mutations.forEach(function (mutation) {
                var entry = {
                    mutation: mutation,
                    el: mutation.target,
                    value: mutation.target.textContent,
                    oldValue: mutation.oldValue
                };
                console.log('Recording mutation:', entry);
            });
            debounce(init(), 1000);
        });

// configuration of the observer:
        var config = {attributes: true, childList: true, characterData: true};

// pass in the target node, as well as the observer options
        observer.observe(target, config);
    }

    function launch() {
        if (window.location.pathname.toLowerCase() !== '/secure/rapidboard.jspa') {
            console.info('JIRALyser: Wrong view, needs to be in /secure/RapidBoard.jspa');
            return;
        }

        if (isActive !== 1) {
            chrome.storage.local.get('active', function (result) {
                isActive = result.active;

                if (!isActive) {
                    console.info('JIRALyser: is disabled in the extension');
                    return;
                } else {
                    chrome.storage.local.get(['url', 'labelOne', 'labelTwo', 'spreadSheet'], function (setup) {
                        url = setup.url;
                        labelOne = setup.labelOne;
                        labelTwo = setup.labelTwo;
                        spreadSheet = setup.spreadSheet;

                        if (url === '' || window.location.href.indexOf(url) === -1) {
                            console.log('wrong url: ' + window.location.href);
                            return;
                        }

                        if (!$('.ghx-sprint-group > div[data-sprint-id]').size()) {
                            window.requestAnimationFrame(launch);
                        } else {
                            $sprints = $('.ghx-sprint-group > div[data-sprint-id]');
                            $.get({
                                url: spreadSheet,
                                setup: setup
                            })
                                .done(function (result) {
                                    var sprintNames = ['',''];
                                    console.table(result);

                                    result = encodeURIComponent(result);
                                    result = result.split('%0D%0A');

                                    for (var x = 0; x < 3; x++) { //There are only support for two labels right now
                                        //Looping the rows
                                        var row = result[x];
                                        var data = row.split('%2C');

                                        spreadSheetData[spreadSheetRowID[x]] = [];

                                        if(x === 0){
                                            for (var r = 2, sprintIdLen = data.length; r < sprintIdLen; r++) {
                                                spreadSheetData[data[r]] = {};
                                                spreadSheetData[data[r]][this.setup[spreadSheetRowID[1]]] = 0;
                                                spreadSheetData[data[r]][this.setup[spreadSheetRowID[2]]]  = 0;

                                                sprintNames.push(data[r]);
                                            }
                                        }else{
                                            for (var q = 2, dataLen = data.length; q < dataLen; q++) {
                                                //spreadSheetData[spreadSheetRowID[x]].push(data[q]);
                                                spreadSheetData[sprintNames[q]][[this.setup[spreadSheetRowID[x]]]] = data[q];
                                            }
                                        }

                                    }

                                    console.table(spreadSheetData);

                                    messageSystem();
                                    eventHandlers();
                                    init();
                                })
                                .fail(function () {
                                    console.log('failed to get spreadsheet');
                                    debugger;
                                });
                        }
                    });
                }
            });
        }
    }

    launch();
}());