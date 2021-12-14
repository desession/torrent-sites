module.exports = {
    pluginOptions: {
      electronBuilder: {
        nodeIntegration: true,
        externals: ['torrentproperty', 'webproperty', 'webtorrent'],
        builderOptions: {
          // options placed here will be merged with default configuration and passed to electron-builder
        }
      }
    }
  }