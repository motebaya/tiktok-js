/**
 * @github.com/motebaya - © 2023-10
 * file: logging
 */
import winston from "winston";

// https://github.com/winstonjs/winston#formats
const logger = (options) => {
  const { level, longformat } = options;
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({
        format: longformat === undefined ? "HH:mm:ss" : "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.printf(({ level, message, timestamp }) => {
        return `[${timestamp}] ${level}::${message}\r`;
      })
    ),
    transports: [
      new winston.transports.Console({
        level: level === "info" ? "level" : "debug",
      }),
      new winston.transports.Http({ level: "http" }),
    ],
  });
};

export default logger;
