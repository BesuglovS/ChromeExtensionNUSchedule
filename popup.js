function formatDate(date) {
    var day = date.getDate();
    if (day < 10) {
        day = "0" + day;
    }

    var month = date.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }

    var year = date.getFullYear();

    return [year, month, day].join("-");
}

function saveData() {
    var groupName = $("#studentGroup option:selected").text();

    if (!groupName) {
        console.log('Error: No value specified');
        return;
    }

    chrome.storage.sync.set({'groupName': groupName}, function () {
        console.log('GroupName (' + groupName +  ') saved');
    });
}

function getData() {
    var options = [];

    $('#studentGroup option').each(function() {
        options.push($(this).text());
    });

    chrome.storage.sync.get("groupName", function callback(result) {
        console.log("Extracted from storage");
        console.log(result.groupName);
        var groupName = result.groupName;
        if (options.includes(groupName)) {
            $('#studentGroup')
                .val($('#studentGroup option')
                    .filter(function () { return $(this).html() == groupName; })
                    .val());
        }
        else
        {
            console.log("В списке нет такой группы (" + groupName + ")");
            console.log(groupName);
            chrome.storage.sync.remove("groupName");
        }

        updateDailySchedule();
    });
}

function updateDailySchedule() {
    $("#result").html("<img src='loading.gif'>");

    var scheduleDate = $("#scheduleDate").val();
    var date = scheduleDate;
    var groupId = $('#studentGroup').val();
    var APIdailyScheduleURL = "http://wiki.nayanova.edu/api.php?action=dailySchedule&date=" + date +
        "&groupIds=" + groupId;

    $.getJSON(APIdailyScheduleURL, function (data) {
        var schedule = data[0];
        var lessons = schedule.Lessons;

        $("#result").html("");

        if (lessons.length == 0) {
            $("#result").html("<h1 style='margin: 1em;'>Занятий нет</h1>");
        }
        else {
            var tableHtml = "<table class='DailySchedule'>";
            lessons.forEach(function (lesson) {
                tableHtml += "<tr>";

                tableHtml += "<td>";
                tableHtml += lesson.Time.substr(0, 5);
                tableHtml += "</td>";

                tableHtml += "<td>";
                tableHtml += lesson.discName;
                tableHtml += "</td>";

                tableHtml += "<td>";
                tableHtml += lesson.FIO;
                tableHtml += "</td>";

                tableHtml += "<td>";
                tableHtml += lesson.audName;
                tableHtml += "</td>";

                tableHtml += "<td>";
                tableHtml += lesson.groupName;
                tableHtml += "</td>";

                tableHtml += "</tr>";
            });
            tableHtml += "</table>";

            $("#result").append(tableHtml);
        }
    });
}
$(function () {
    var pageLogo = chrome.extension.getURL("nu48.png");
    $("#pageLogo").attr('src', pageLogo);

    $("#result").html("<img src='loading.gif'>");

    var scheduleDate = new Date();
    $("#scheduleDate").val(formatDate(scheduleDate));

    var studentGroups = [];
    var APImainGroupsURL = "http://wiki.nayanova.edu/api.php?action=list&listtype=mainStudentGroups";
    $.getJSON(APImainGroupsURL, function (data) {
        studentGroups = data;

        studentGroups.forEach(function (studentGroup) {
            $('#studentGroup')
                .append('<option value="' + studentGroup.StudentGroupId + '">'
                    + studentGroup.Name + '</option>');
        });

        getData();

        $( "#studentGroup" ).change(function() {
            updateDailySchedule();
            saveData();
        });

        $( "#scheduleDate" ).change(function() {
            updateDailySchedule();
        });
    });

});