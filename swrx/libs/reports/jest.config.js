module.exports = {
  name: 'reports',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/libs/reports',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
