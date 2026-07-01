function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  const params = getRequestParams_(e);
  const action = params.action || 'getDashboard';

  try {
    if (action === 'health') return jsonResponse_(healthCheck_());
    if (action === 'setup') return jsonResponse_(setupEventHub());
    if (action === 'getConfig') return jsonResponse_(getConfig_());
    if (action === 'loginEvent') return jsonResponse_(loginEvent_(params));
    if (action === 'createEventAuto') return jsonResponse_(createEventAuto_(params));
    if (action === 'getEvents') return jsonResponse_(getEvents_(params));
    if (action === 'getDashboard') return jsonResponse_(getDashboard_(params));
    if (action === 'getBlocks') return jsonResponse_(getBlocks_(params));
    if (action === 'createBlock') return jsonResponse_(createBlock_(params));
    if (action === 'updateBlock') return jsonResponse_(updateBlock_(params));
    if (action === 'deleteBlock') return jsonResponse_(deleteBlock_(params));

    return jsonResponse_({
      success: false,
      message: 'Unknown action: ' + action
    });
  } catch (error) {
    logError_('handleRequest_', error, params);
    return jsonResponse_({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
}
