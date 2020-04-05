import * as annautils from 'annautils';

/*
 * file operations
 *
 * support upload breakpoint resume
 *
 * 1. handshake
 *
 *  a. request
 *    header := -----------------------------------------------------
 *              | opcode |  SID   | path1_len |   path1   | options |
 *              |  1byte | 32byte |   2byte   | path1_len |   ---   |
 *              -----------------------------------------------------
 *    opcode := REMOVE | MOVE | GETDIR | CHMOD | CHOWN 
 *            | EXECUTE | GETFILE | UPLOAD | MODIFY
 *      if opcode = REMOVE | GETDIR | EXECUTE | GETFILE | UPLOAD |GETDIR
 *          options = null
 *      if opcode = MOVE 
 *          options = [ path2_len | path2 ]
 *      if opcode = CHMOD
 *          options = [ x xxx ] 4bytes
 *      if opcode = CHOWN
 *          options = [ own_len | own ]
 *
 *  b. response
 *    header := -----------------------------------------------------
 *              | status | accept
 *              |
 *              -----------------------------------------------------
 */
