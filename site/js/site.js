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
    log.addData(3, '2022-01-01 8:00');
});

$('#btnReset').on('click', function () {
    $('#inLogDate').val('').prop('disabled', false);
    $('#inLogTime').val('');
    $('#slctLogStatus').val('1');
    $('#btnAdd').prop('disabled', true);
    log.reset();
});