exports.config = {
  // The address of a running selenium server.
  seleniumAddress: 'http://localhost:4444/wd/hub',
 
  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    browserName: 'chrome'
  },
 
  // Spec patterns are relative to the configuration file location passed
  // to protractor (in this example conf.js).
  // They may include glob patterns.
  specs: ['PracticeExercise.js'],
 
 
};