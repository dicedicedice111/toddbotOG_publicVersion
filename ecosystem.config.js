   module.exports = {
     apps : [{
       name: "discord-bot",
       script: "src/index.js",
       watch: true,
       env: {
         NODE_ENV: "production",
       },
       error_file: "logs/err.log",
       out_file: "logs/out.log",
       log_file: "logs/combined.log",
       time: true
     }]
   }

