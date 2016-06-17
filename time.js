function init() {
    var url = 'http://jira.lenslogistics.int';
    var $worklogged = $('td[headers="series-event-type"]:contains("Work logged")');
    var users = [];
    var user = {};
    user.name = '';
    user.logs = [];
    user.total = 0;

    var $parent = null;
    var thatDate = null;
    var thatLink = null;
    var logCache = {};

    $(document).ajaxStop(function () {

        //sprints.sort(function (thisSprint, thatSprint) {
        //    if (thisSprint.sprintId > thatSprint.sprintId) {
        //        return 1;
        //    }
        //    if (thisSprint.value < thatSprint.value) {
        //        return -1;
        //    }
        //});
    });

    $worklogged.each(function getListOfWorklogs(index, item) {

        $parent = $(item).parent();
        thatDate = new Date($parent.find('td[headers="series-date"]').text());
        thatLink = $parent.find('td[headers="series-issue"] a');
        thatLink = thatLink[thatLink.length - 1].innerText;

        if (logCache[thatLink]) {
            logCache[thatLink].worklogs.forEach(function getEachIssue(log) {
                debugger;
            })
        } else {
            (function () {
                $.ajax({
                        url: url + '/rest/api/2/issue/' + thatLink + '/worklog',
                        type: 'GET',
                        dataType: 'json',
                        $thisParent: $parent,
                        thatDate:thatDate,
                        thatLink: thatLink
                    })
                    .done(function getIssuesInCurrentSprint(data) {
                        var that = this;
                        var log = null;

                        for(var i = 0, workLen = data.worklogs.length; i < workLen; i++ ){
                            debugger;
                            log = data.worklogs[i];
                            if(new Date(log.started).getTime() === that.thatDate.getTime()){
                                debugger;
                            }
                        }


                        if (!logCache[this.thatLink]) {
                            logCache[this.thatLink] = {};
                        }

                        logCache[this.thatLink].worklogs = data.worklogs;
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        console.log('HTTP Request Failed');
                    })
            }())
        }
    })
}