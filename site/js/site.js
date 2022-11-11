$('#inLogDate').prop('max', new Date().toISOString().substring(0, 10));

const statusObj = {
    1: 'Off-duty',
    2: 'Sleeper berth',
    3: 'Driving',
    4: 'On-duty'
}

$('#slctStartStatus').on('change', function () {
    var s = $(this).val();

    if (!isNaN(s) && s >= 1 && s <= 4) {
        log.setStart(s);
    }
});

$('#inLogDate').on('blur', function () {
    var strDate = $(this).val();
    var d = new Date(strDate);

    if (!isNaN(d)) {
        $(this).prop('disabled', true);
        $('#btnAdd').prop('disabled', false);
    } else {
        $(this).prop('disabled', false);
        $('#btnAdd').prop('disabled', true);
    }
});

$('#btnAdd').on('click', function () {
    var d = $('#inLogDate').val();
    var s = $('#slctLogStatus').val();
    var t = $('#inLogTime').val();

    if (d && t && !isNaN(s) && s >= 1 && s <= 4) {
        var dt = new Date(d + ' ' + t);
        log.addData(s, dt);

        $('#slctLogStatus').val('1');
        $('#inLogTime').val('');

        var dataArr = log.data;

        $('#tblLog>tbody').empty();
        for (const dataObj of dataArr) {
            var eventTime = new Date(dataObj.d).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            });

            $('#tblLog>tbody').append('<tr><td></td><td>' + eventTime + '</td><td>' + statusObj[dataObj.status] + '</td></tr>');
        }
    }
});

$('#btnReset').on('click', function () {
    $('#slctStartStatus').val('1');
    $('#inLogDate').val('').prop('disabled', false);

    $('#slctLogStatus').val('1');
    $('#inLogTime').val('');

    $('#btnAdd').prop('disabled', true);

    log.setStart(1);
    log.reset();

    $('#tblLog>tbody').empty();
});