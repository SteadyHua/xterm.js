/**
 * Copyright (c) 2017 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { assert, expect } from 'chai';
import { InputHandler } from './InputHandler';
import { MockInputHandlingTerminal, TestTerminal } from './TestUtils.test';
import { Terminal } from './Terminal';
import { IBufferLine } from 'common/Types';
import { DEFAULT_ATTR_DATA } from 'common/buffer/BufferLine';
import { CellData } from 'common/buffer/CellData';
import { Attributes } from 'common/buffer/Constants';
import { AttributeData } from 'common/buffer/AttributeData';
import { Params } from 'common/parser/Params';
import { MockCoreService } from 'common/TestUtils.test';

function getCursor(term: TestTerminal): number[] {
  return [
    term.buffer.x,
    term.buffer.y
  ];
}

describe('InputHandler', () => {
  describe('save and restore cursor', () => {
    const terminal = new MockInputHandlingTerminal();
    terminal.cols = 80;
    terminal.rows = 30;
    terminal.buffer.x = 1;
    terminal.buffer.y = 2;
    terminal.buffer.ybase = 0;
    terminal.curAttrData.fg = 3;
    const inputHandler = new InputHandler(terminal, new MockCoreService());
    // Save cursor position
    inputHandler.saveCursor();
    assert.equal(terminal.buffer.x, 1);
    assert.equal(terminal.buffer.y, 2);
    assert.equal(terminal.curAttrData.fg, 3);
    // Change cursor position
    terminal.buffer.x = 10;
    terminal.buffer.y = 20;
    terminal.curAttrData.fg = 30;
    // Restore cursor position
    inputHandler.restoreCursor();
    assert.equal(terminal.buffer.x, 1);
    assert.equal(terminal.buffer.y, 2);
    assert.equal(terminal.curAttrData.fg, 3);
  });
  describe('setCursorStyle', () => {
    it('should call Terminal.setOption with correct params', () => {
      const terminal = new MockInputHandlingTerminal();
      const inputHandler = new InputHandler(terminal, new MockCoreService());
      const collect = ' ';

      inputHandler.setCursorStyle(Params.fromArray([0]), collect);
      assert.equal(terminal.options['cursorStyle'], 'block');
      assert.equal(terminal.options['cursorBlink'], true);

      terminal.options = {};
      inputHandler.setCursorStyle(Params.fromArray([1]), collect);
      assert.equal(terminal.options['cursorStyle'], 'block');
      assert.equal(terminal.options['cursorBlink'], true);

      terminal.options = {};
      inputHandler.setCursorStyle(Params.fromArray([2]), collect);
      assert.equal(terminal.options['cursorStyle'], 'block');
      assert.equal(terminal.options['cursorBlink'], false);

      terminal.options = {};
      inputHandler.setCursorStyle(Params.fromArray([3]), collect);
      assert.equal(terminal.options['cursorStyle'], 'underline');
      assert.equal(terminal.options['cursorBlink'], true);

      terminal.options = {};
      inputHandler.setCursorStyle(Params.fromArray([4]), collect);
      assert.equal(terminal.options['cursorStyle'], 'underline');
      assert.equal(terminal.options['cursorBlink'], false);

      terminal.options = {};
      inputHandler.setCursorStyle(Params.fromArray([5]), collect);
      assert.equal(terminal.options['cursorStyle'], 'bar');
      assert.equal(terminal.options['cursorBlink'], true);

      terminal.options = {};
      inputHandler.setCursorStyle(Params.fromArray([6]), collect);
      assert.equal(terminal.options['cursorStyle'], 'bar');
      assert.equal(terminal.options['cursorBlink'], false);
    });
  });
  describe('setMode', () => {
    it('should toggle Terminal.bracketedPasteMode', () => {
      const terminal = new MockInputHandlingTerminal();
      const collect = '?';
      terminal.bracketedPasteMode = false;
      const inputHandler = new InputHandler(terminal, new MockCoreService());
      // Set bracketed paste mode
      inputHandler.setMode(Params.fromArray([2004]), collect);
      assert.equal(terminal.bracketedPasteMode, true);
      // Reset bracketed paste mode
      inputHandler.resetMode(Params.fromArray([2004]), collect);
      assert.equal(terminal.bracketedPasteMode, false);
    });
  });
  describe('regression tests', function(): void {
    function termContent(term: Terminal, trim: boolean): string[] {
      const result = [];
      for (let i = 0; i < term.rows; ++i) result.push(term.buffer.lines.get(i).translateToString(trim));
      return result;
    }

    it('insertChars', function(): void {
      const term = new Terminal();
      const inputHandler = new InputHandler(term, new MockCoreService());

      // insert some data in first and second line
      inputHandler.parse(Array(term.cols - 9).join('a'));
      inputHandler.parse('1234567890');
      inputHandler.parse(Array(term.cols - 9).join('a'));
      inputHandler.parse('1234567890');
      const line1: IBufferLine = term.buffer.lines.get(0);
      expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '1234567890');

      // insert one char from params = [0]
      term.buffer.y = 0;
      term.buffer.x = 70;
      inputHandler.insertChars(Params.fromArray([0]));
      expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + ' 123456789');

      // insert one char from params = [1]
      term.buffer.y = 0;
      term.buffer.x = 70;
      inputHandler.insertChars(Params.fromArray([1]));
      expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '  12345678');

      // insert two chars from params = [2]
      term.buffer.y = 0;
      term.buffer.x = 70;
      inputHandler.insertChars(Params.fromArray([2]));
      expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '    123456');

      // insert 10 chars from params = [10]
      term.buffer.y = 0;
      term.buffer.x = 70;
      inputHandler.insertChars(Params.fromArray([10]));
      expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '          ');
      expect(line1.translateToString(true)).equals(Array(term.cols - 9).join('a'));
    });
    it('deleteChars', function(): void {
      const term = new Terminal();
      const inputHandler = new InputHandler(term, new MockCoreService());

      // insert some data in first and second line
      inputHandler.parse(Array(term.cols - 9).join('a'));
      inputHandler.parse('1234567890');
      inputHandler.parse(Array(term.cols - 9).join('a'));
      inputHandler.parse('1234567890');
      const line1: IBufferLine = term.buffer.lines.get(0);
      expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '1234567890');

      // delete one char from params = [0]
      term.buffer.y = 0;
      term.buffer.x = 70;
      inputHandler.deleteChars(Params.fromArray([0]));
      expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '234567890 ');
      expect(line1.translateToString(true)).equals(Array(term.cols - 9).join('a') + '234567890');

      // insert one char from params = [1]
      term.buffer.y = 0;
      term.buffer.x = 70;
      inputHandler.deleteChars(Params.fromArray([1]));
      expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '34567890  ');
      expect(line1.translateToString(true)).equals(Array(term.cols - 9).join('a') + '34567890');

      // insert two chars from params = [2]
      term.buffer.y = 0;
      term.buffer.x = 70;
      inputHandler.deleteChars(Params.fromArray([2]));
      expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '567890    ');
      expect(line1.translateToString(true)).equals(Array(term.cols - 9).join('a') + '567890');

      // insert 10 chars from params = [10]
      term.buffer.y = 0;
      term.buffer.x = 70;
      inputHandler.deleteChars(Params.fromArray([10]));
      expect(line1.translateToString(false)).equals(Array(term.cols - 9).join('a') + '          ');
      expect(line1.translateToString(true)).equals(Array(term.cols - 9).join('a'));
    });
    it('eraseInLine', function(): void {
      const term = new Terminal();
      const inputHandler = new InputHandler(term, new MockCoreService());

      // fill 6 lines to test 3 different states
      inputHandler.parse(Array(term.cols + 1).join('a'));
      inputHandler.parse(Array(term.cols + 1).join('a'));
      inputHandler.parse(Array(term.cols + 1).join('a'));

      // params[0] - right erase
      term.buffer.y = 0;
      term.buffer.x = 70;
      inputHandler.eraseInLine(Params.fromArray([0]));
      expect(term.buffer.lines.get(0).translateToString(false)).equals(Array(71).join('a') + '          ');

      // params[1] - left erase
      term.buffer.y = 1;
      term.buffer.x = 70;
      inputHandler.eraseInLine(Params.fromArray([1]));
      expect(term.buffer.lines.get(1).translateToString(false)).equals(Array(71).join(' ') + ' aaaaaaaaa');

      // params[1] - left erase
      term.buffer.y = 2;
      term.buffer.x = 70;
      inputHandler.eraseInLine(Params.fromArray([2]));
      expect(term.buffer.lines.get(2).translateToString(false)).equals(Array(term.cols + 1).join(' '));

    });
    it('eraseInDisplay', function(): void {
      const term = new Terminal({cols: 80, rows: 7});
      const inputHandler = new InputHandler(term, new MockCoreService());

      // fill display with a's
      for (let i = 0; i < term.rows; ++i) inputHandler.parse(Array(term.cols + 1).join('a'));

      // params [0] - right and below erase
      term.buffer.y = 5;
      term.buffer.x = 40;
      inputHandler.eraseInDisplay(Params.fromArray([0]));
      expect(termContent(term, false)).eql([
        Array(term.cols + 1).join('a'),
        Array(term.cols + 1).join('a'),
        Array(term.cols + 1).join('a'),
        Array(term.cols + 1).join('a'),
        Array(term.cols + 1).join('a'),
        Array(40 + 1).join('a') + Array(term.cols - 40 + 1).join(' '),
        Array(term.cols + 1).join(' ')
      ]);
      expect(termContent(term, true)).eql([
        Array(term.cols + 1).join('a'),
        Array(term.cols + 1).join('a'),
        Array(term.cols + 1).join('a'),
        Array(term.cols + 1).join('a'),
        Array(term.cols + 1).join('a'),
        Array(40 + 1).join('a'),
        ''
      ]);

      // reset
      term.buffer.y = 0;
      term.buffer.x = 0;
      for (let i = 0; i < term.rows; ++i) inputHandler.parse(Array(term.cols + 1).join('a'));

      // params [1] - left and above
      term.buffer.y = 5;
      term.buffer.x = 40;
      inputHandler.eraseInDisplay(Params.fromArray([1]));
      expect(termContent(term, false)).eql([
        Array(term.cols + 1).join(' '),
        Array(term.cols + 1).join(' '),
        Array(term.cols + 1).join(' '),
        Array(term.cols + 1).join(' '),
        Array(term.cols + 1).join(' '),
        Array(41 + 1).join(' ') + Array(term.cols - 41 + 1).join('a'),
        Array(term.cols + 1).join('a')
      ]);
      expect(termContent(term, true)).eql([
        '',
        '',
        '',
        '',
        '',
        Array(41 + 1).join(' ') + Array(term.cols - 41 + 1).join('a'),
        Array(term.cols + 1).join('a')
      ]);

      // reset
      term.buffer.y = 0;
      term.buffer.x = 0;
      for (let i = 0; i < term.rows; ++i) inputHandler.parse(Array(term.cols + 1).join('a'));

      // params [2] - whole screen
      term.buffer.y = 5;
      term.buffer.x = 40;
      inputHandler.eraseInDisplay(Params.fromArray([2]));
      expect(termContent(term, false)).eql([
        Array(term.cols + 1).join(' '),
        Array(term.cols + 1).join(' '),
        Array(term.cols + 1).join(' '),
        Array(term.cols + 1).join(' '),
        Array(term.cols + 1).join(' '),
        Array(term.cols + 1).join(' '),
        Array(term.cols + 1).join(' ')
      ]);
      expect(termContent(term, true)).eql([
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]);

      // reset and add a wrapped line
      term.buffer.y = 0;
      term.buffer.x = 0;
      inputHandler.parse(Array(term.cols + 1).join('a')); // line 0
      inputHandler.parse(Array(term.cols + 10).join('a')); // line 1 and 2
      for (let i = 3; i < term.rows; ++i) inputHandler.parse(Array(term.cols + 1).join('a'));

      // params[1] left and above with wrap
      // confirm precondition that line 2 is wrapped
      expect(term.buffer.lines.get(2).isWrapped).true;
      term.buffer.y = 2;
      term.buffer.x = 40;
      inputHandler.eraseInDisplay(Params.fromArray([1]));
      expect(term.buffer.lines.get(2).isWrapped).false;

      // reset and add a wrapped line
      term.buffer.y = 0;
      term.buffer.x = 0;
      inputHandler.parse(Array(term.cols + 1).join('a')); // line 0
      inputHandler.parse(Array(term.cols + 10).join('a')); // line 1 and 2
      for (let i = 3; i < term.rows; ++i) inputHandler.parse(Array(term.cols + 1).join('a'));

      // params[1] left and above with wrap
      // confirm precondition that line 2 is wrapped
      expect(term.buffer.lines.get(2).isWrapped).true;
      term.buffer.y = 1;
      term.buffer.x = 90; // Cursor is beyond last column
      inputHandler.eraseInDisplay(Params.fromArray([1]));
      expect(term.buffer.lines.get(2).isWrapped).false;
    });
  });
  it('convertEol setting', function(): void {
    // not converting
    const termNotConverting = new Terminal({cols: 15, rows: 10});
    (termNotConverting as any)._inputHandler.parse('Hello\nWorld');
    expect(termNotConverting.buffer.lines.get(0).translateToString(false)).equals('Hello          ');
    expect(termNotConverting.buffer.lines.get(1).translateToString(false)).equals('     World     ');
    expect(termNotConverting.buffer.lines.get(0).translateToString(true)).equals('Hello');
    expect(termNotConverting.buffer.lines.get(1).translateToString(true)).equals('     World');

    // converting
    const termConverting = new Terminal({cols: 15, rows: 10, convertEol: true});
    (termConverting as any)._inputHandler.parse('Hello\nWorld');
    expect(termConverting.buffer.lines.get(0).translateToString(false)).equals('Hello          ');
    expect(termConverting.buffer.lines.get(1).translateToString(false)).equals('World          ');
    expect(termConverting.buffer.lines.get(0).translateToString(true)).equals('Hello');
    expect(termConverting.buffer.lines.get(1).translateToString(true)).equals('World');
  });
  describe('print', () => {
    it('should not cause an infinite loop (regression test)', () => {
      const term = new Terminal();
      const inputHandler = new InputHandler(term, new MockCoreService());
      const container = new Uint32Array(10);
      container[0] = 0x200B;
      inputHandler.print(container, 0, 1);
    });
  });

  describe('alt screen', () => {
    let term: Terminal;
    let handler: InputHandler;

    beforeEach(() => {
      term = new Terminal();
      handler = new InputHandler(term, new MockCoreService());
    });
    it('should handle DECSET/DECRST 47 (alt screen buffer)', () => {
      handler.parse('\x1b[?47h\r\n\x1b[31mJUNK\x1b[?47lTEST');
      expect(term.buffer.translateBufferLineToString(0, true)).to.equal('');
      expect(term.buffer.translateBufferLineToString(1, true)).to.equal('    TEST');
      // Text color of 'TEST' should be red
      expect((term.buffer.lines.get(1).loadCell(4, new CellData()).getFgColor())).to.equal(1);
    });
    it('should handle DECSET/DECRST 1047 (alt screen buffer)', () => {
      handler.parse('\x1b[?1047h\r\n\x1b[31mJUNK\x1b[?1047lTEST');
      expect(term.buffer.translateBufferLineToString(0, true)).to.equal('');
      expect(term.buffer.translateBufferLineToString(1, true)).to.equal('    TEST');
      // Text color of 'TEST' should be red
      expect((term.buffer.lines.get(1).loadCell(4, new CellData()).getFgColor())).to.equal(1);
    });
    it('should handle DECSET/DECRST 1048 (alt screen cursor)', () => {
      handler.parse('\x1b[?1048h\r\n\x1b[31mJUNK\x1b[?1048lTEST');
      expect(term.buffer.translateBufferLineToString(0, true)).to.equal('TEST');
      expect(term.buffer.translateBufferLineToString(1, true)).to.equal('JUNK');
      // Text color of 'TEST' should be default
      expect(term.buffer.lines.get(0).loadCell(0, new CellData()).fg).to.equal(DEFAULT_ATTR_DATA.fg);
      // Text color of 'JUNK' should be red
      expect((term.buffer.lines.get(1).loadCell(0, new CellData()).getFgColor())).to.equal(1);
    });
    it('should handle DECSET/DECRST 1049 (alt screen buffer+cursor)', () => {
      handler.parse('\x1b[?1049h\r\n\x1b[31mJUNK\x1b[?1049lTEST');
      expect(term.buffer.translateBufferLineToString(0, true)).to.equal('TEST');
      expect(term.buffer.translateBufferLineToString(1, true)).to.equal('');
      // Text color of 'TEST' should be default
      expect(term.buffer.lines.get(0).loadCell(0, new CellData()).fg).to.equal(DEFAULT_ATTR_DATA.fg);
    });
    it('should handle DECSET/DECRST 1049 - maintains saved cursor for alt buffer', () => {
      handler.parse('\x1b[?1049h\r\n\x1b[31m\x1b[s\x1b[?1049lTEST');
      expect(term.buffer.translateBufferLineToString(0, true)).to.equal('TEST');
      // Text color of 'TEST' should be default
      expect(term.buffer.lines.get(0).loadCell(0, new CellData()).fg).to.equal(DEFAULT_ATTR_DATA.fg);
      handler.parse('\x1b[?1049h\x1b[uTEST');
      expect(term.buffer.translateBufferLineToString(1, true)).to.equal('TEST');
      // Text color of 'TEST' should be red
      expect((term.buffer.lines.get(1).loadCell(0, new CellData()).getFgColor())).to.equal(1);
    });
    it('should handle DECSET/DECRST 1049 - clears alt buffer with erase attributes', () => {
      handler.parse('\x1b[42m\x1b[?1049h');
      // Buffer should be filled with green background
      expect(term.buffer.lines.get(20).loadCell(10, new CellData()).getBgColor()).to.equal(2);
    });
  });

  describe('text attributes', () => {
    let term: TestTerminal;
    beforeEach(() => {
      term = new TestTerminal();
    });
    it('bold', () => {
      term.writeSync('\x1b[1m');
      assert.equal(!!term.curAttrData.isBold(), true);
      term.writeSync('\x1b[22m');
      assert.equal(!!term.curAttrData.isBold(), false);
    });
    it('dim', () => {
      term.writeSync('\x1b[2m');
      assert.equal(!!term.curAttrData.isDim(), true);
      term.writeSync('\x1b[22m');
      assert.equal(!!term.curAttrData.isDim(), false);
    });
    it('italic', () => {
      term.writeSync('\x1b[3m');
      assert.equal(!!term.curAttrData.isItalic(), true);
      term.writeSync('\x1b[23m');
      assert.equal(!!term.curAttrData.isItalic(), false);
    });
    it('underline', () => {
      term.writeSync('\x1b[4m');
      assert.equal(!!term.curAttrData.isUnderline(), true);
      term.writeSync('\x1b[24m');
      assert.equal(!!term.curAttrData.isUnderline(), false);
    });
    it('blink', () => {
      term.writeSync('\x1b[5m');
      assert.equal(!!term.curAttrData.isBlink(), true);
      term.writeSync('\x1b[25m');
      assert.equal(!!term.curAttrData.isBlink(), false);
    });
    it('inverse', () => {
      term.writeSync('\x1b[7m');
      assert.equal(!!term.curAttrData.isInverse(), true);
      term.writeSync('\x1b[27m');
      assert.equal(!!term.curAttrData.isInverse(), false);
    });
    it('invisible', () => {
      term.writeSync('\x1b[8m');
      assert.equal(!!term.curAttrData.isInvisible(), true);
      term.writeSync('\x1b[28m');
      assert.equal(!!term.curAttrData.isInvisible(), false);
    });
    it('colormode palette 16', () => {
      assert.equal(term.curAttrData.getFgColorMode(), 0); // DEFAULT
      assert.equal(term.curAttrData.getBgColorMode(), 0); // DEFAULT
      // lower 8 colors
      for (let i = 0; i < 8; ++i) {
        term.writeSync(`\x1b[${i + 30};${i + 40}m`);
        assert.equal(term.curAttrData.getFgColorMode(), Attributes.CM_P16);
        assert.equal(term.curAttrData.getFgColor(), i);
        assert.equal(term.curAttrData.getBgColorMode(), Attributes.CM_P16);
        assert.equal(term.curAttrData.getBgColor(), i);
      }
      // reset to DEFAULT
      term.writeSync(`\x1b[39;49m`);
      assert.equal(term.curAttrData.getFgColorMode(), 0);
      assert.equal(term.curAttrData.getBgColorMode(), 0);
    });
    it('colormode palette 256', () => {
      assert.equal(term.curAttrData.getFgColorMode(), 0); // DEFAULT
      assert.equal(term.curAttrData.getBgColorMode(), 0); // DEFAULT
      // lower 8 colors
      for (let i = 0; i < 256; ++i) {
        term.writeSync(`\x1b[38;5;${i};48;5;${i}m`);
        assert.equal(term.curAttrData.getFgColorMode(), Attributes.CM_P256);
        assert.equal(term.curAttrData.getFgColor(), i);
        assert.equal(term.curAttrData.getBgColorMode(), Attributes.CM_P256);
        assert.equal(term.curAttrData.getBgColor(), i);
      }
      // reset to DEFAULT
      term.writeSync(`\x1b[39;49m`);
      assert.equal(term.curAttrData.getFgColorMode(), 0);
      assert.equal(term.curAttrData.getFgColor(), -1);
      assert.equal(term.curAttrData.getBgColorMode(), 0);
      assert.equal(term.curAttrData.getBgColor(), -1);
    });
    it('colormode RGB', () => {
      assert.equal(term.curAttrData.getFgColorMode(), 0); // DEFAULT
      assert.equal(term.curAttrData.getBgColorMode(), 0); // DEFAULT
      term.writeSync(`\x1b[38;2;1;2;3;48;2;4;5;6m`);
      assert.equal(term.curAttrData.getFgColorMode(), Attributes.CM_RGB);
      assert.equal(term.curAttrData.getFgColor(), 1 << 16 | 2 << 8 | 3);
      assert.deepEqual(AttributeData.toColorRGB(term.curAttrData.getFgColor()), [1, 2, 3]);
      assert.equal(term.curAttrData.getBgColorMode(), Attributes.CM_RGB);
      assert.deepEqual(AttributeData.toColorRGB(term.curAttrData.getBgColor()), [4, 5, 6]);
      // reset to DEFAULT
      term.writeSync(`\x1b[39;49m`);
      assert.equal(term.curAttrData.getFgColorMode(), 0);
      assert.equal(term.curAttrData.getFgColor(), -1);
      assert.equal(term.curAttrData.getBgColorMode(), 0);
      assert.equal(term.curAttrData.getBgColor(), -1);
    });
    it('colormode transition RGB to 256', () => {
      // enter RGB for FG and BG
      term.writeSync(`\x1b[38;2;1;2;3;48;2;4;5;6m`);
      // enter 256 for FG and BG
      term.writeSync(`\x1b[38;5;255;48;5;255m`);
      assert.equal(term.curAttrData.getFgColorMode(), Attributes.CM_P256);
      assert.equal(term.curAttrData.getFgColor(), 255);
      assert.equal(term.curAttrData.getBgColorMode(), Attributes.CM_P256);
      assert.equal(term.curAttrData.getBgColor(), 255);
    });
    it('colormode transition RGB to 16', () => {
      // enter RGB for FG and BG
      term.writeSync(`\x1b[38;2;1;2;3;48;2;4;5;6m`);
      // enter 16 for FG and BG
      term.writeSync(`\x1b[37;47m`);
      assert.equal(term.curAttrData.getFgColorMode(), Attributes.CM_P16);
      assert.equal(term.curAttrData.getFgColor(), 7);
      assert.equal(term.curAttrData.getBgColorMode(), Attributes.CM_P16);
      assert.equal(term.curAttrData.getBgColor(), 7);
    });
    it('colormode transition 16 to 256', () => {
      // enter 16 for FG and BG
      term.writeSync(`\x1b[37;47m`);
      // enter 256 for FG and BG
      term.writeSync(`\x1b[38;5;255;48;5;255m`);
      assert.equal(term.curAttrData.getFgColorMode(), Attributes.CM_P256);
      assert.equal(term.curAttrData.getFgColor(), 255);
      assert.equal(term.curAttrData.getBgColorMode(), Attributes.CM_P256);
      assert.equal(term.curAttrData.getBgColor(), 255);
    });
    it('colormode transition 256 to 16', () => {
      // enter 256 for FG and BG
      term.writeSync(`\x1b[38;5;255;48;5;255m`);
      // enter 16 for FG and BG
      term.writeSync(`\x1b[37;47m`);
      assert.equal(term.curAttrData.getFgColorMode(), Attributes.CM_P16);
      assert.equal(term.curAttrData.getFgColor(), 7);
      assert.equal(term.curAttrData.getBgColorMode(), Attributes.CM_P16);
      assert.equal(term.curAttrData.getBgColor(), 7);
    });
    it('should zero missing RGB values', () => {
      term.writeSync(`\x1b[38;2;1;2;3m`);
      term.writeSync(`\x1b[38;2;5m`);
      assert.deepEqual(AttributeData.toColorRGB(term.curAttrData.getFgColor()), [5, 0, 0]);
    });
  });
  describe('colon notation', () => {
    let termColon: TestTerminal;
    let termSemicolon: TestTerminal;
    beforeEach(() => {
      termColon = new TestTerminal();
      termSemicolon = new TestTerminal();
    });
    describe('should equal to semicolon', () => {
      it('CSI 38:2::50:100:150 m', () => {
        termColon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.writeSync('\x1b[38;2;50;100;150m');
        termColon.writeSync('\x1b[38:2::50:100:150m');
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 50 << 16 | 100 << 8 | 150);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 38:2::50:100: m', () => {
        termColon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.writeSync('\x1b[38;2;50;100;m');
        termColon.writeSync('\x1b[38:2::50:100:m');
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 50 << 16 | 100 << 8 | 0);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 38:2::50:: m', () => {
        termColon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.writeSync('\x1b[38;2;50;;m');
        termColon.writeSync('\x1b[38:2::50::m');
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 50 << 16 | 0 << 8 | 0);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 38:2:::: m', () => {
        termColon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.writeSync('\x1b[38;2;;;m');
        termColon.writeSync('\x1b[38:2::::m');
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 0 << 16 | 0 << 8 | 0);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 38;2::50:100:150 m', () => {
        termColon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.writeSync('\x1b[38;2;50;100;150m');
        termColon.writeSync('\x1b[38;2::50:100:150m');
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 50 << 16 | 100 << 8 | 150);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 38;2;50:100:150 m', () => {
        termColon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.writeSync('\x1b[38;2;50;100;150m');
        termColon.writeSync('\x1b[38;2;50:100:150m');
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 50 << 16 | 100 << 8 | 150);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 38;2;50;100:150 m', () => {
        termColon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.writeSync('\x1b[38;2;50;100;150m');
        termColon.writeSync('\x1b[38;2;50;100:150m');
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 50 << 16 | 100 << 8 | 150);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 38:5:50 m', () => {
        termColon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.writeSync('\x1b[38;5;50m');
        termColon.writeSync('\x1b[38:5:50m');
        assert.equal(termSemicolon.curAttrData.fg & 0xFF, 50);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 38:5: m', () => {
        termColon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.writeSync('\x1b[38;5;m');
        termColon.writeSync('\x1b[38:5:m');
        assert.equal(termSemicolon.curAttrData.fg & 0xFF, 0);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 38;5:50 m', () => {
        termColon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.writeSync('\x1b[38;5;50m');
        termColon.writeSync('\x1b[38;5:50m');
        assert.equal(termSemicolon.curAttrData.fg & 0xFF, 50);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
    });
    describe('should fill early sequence end with default of 0', () => {
      it('CSI 38:2 m', () => {
        termColon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.writeSync('\x1b[38;2m');
        termColon.writeSync('\x1b[38:2m');
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 0 << 16 | 0 << 8 | 0);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 38:5 m', () => {
        termColon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.curAttrData.fg = 0xFFFFFFFF;
        termSemicolon.writeSync('\x1b[38;5m');
        termColon.writeSync('\x1b[38:5m');
        assert.equal(termSemicolon.curAttrData.fg & 0xFF, 0);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
    });
    describe('should not interfere with leading/following SGR attrs', () => {
      it('CSI 1 ; 38:2::50:100:150 ; 4 m', () => {
        termSemicolon.writeSync('\x1b[1;38;2;50;100;150;4m');
        termColon.writeSync('\x1b[1;38:2::50:100:150;4m');
        assert.equal(!!termSemicolon.curAttrData.isBold(), true);
        assert.equal(!!termSemicolon.curAttrData.isUnderline(), true);
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 50 << 16 | 100 << 8 | 150);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 1 ; 38:2::50:100: ; 4 m', () => {
        termSemicolon.writeSync('\x1b[1;38;2;50;100;;4m');
        termColon.writeSync('\x1b[1;38:2::50:100:;4m');
        assert.equal(!!termSemicolon.curAttrData.isBold(), true);
        assert.equal(!!termSemicolon.curAttrData.isUnderline(), true);
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 50 << 16 | 100 << 8 | 0);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 1 ; 38:2::50:100 ; 4 m', () => {
        termSemicolon.writeSync('\x1b[1;38;2;50;100;;4m');
        termColon.writeSync('\x1b[1;38:2::50:100;4m');
        assert.equal(!!termSemicolon.curAttrData.isBold(), true);
        assert.equal(!!termSemicolon.curAttrData.isUnderline(), true);
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 50 << 16 | 100 << 8 | 0);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 1 ; 38:2:: ; 4 m', () => {
        termSemicolon.writeSync('\x1b[1;38;2;;;;4m');
        termColon.writeSync('\x1b[1;38:2::;4m');
        assert.equal(!!termSemicolon.curAttrData.isBold(), true);
        assert.equal(!!termSemicolon.curAttrData.isUnderline(), true);
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 0);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
      it('CSI 1 ; 38;2:: ; 4 m', () => {
        termSemicolon.writeSync('\x1b[1;38;2;;;;4m');
        termColon.writeSync('\x1b[1;38;2::;4m');
        assert.equal(!!termSemicolon.curAttrData.isBold(), true);
        assert.equal(!!termSemicolon.curAttrData.isUnderline(), true);
        assert.equal(termSemicolon.curAttrData.fg & 0xFFFFFF, 0);
        assert.equal(termColon.curAttrData.fg, termSemicolon.curAttrData.fg);
      });
    });
  });
  describe('cursor positioning', () => {
    let term: TestTerminal;
    beforeEach(() => {
      term = new TestTerminal({cols: 10, rows: 10});
    });
    it('cursor forward (CUF)', () => {
      term.writeSync('\x1b[C');
      assert.deepEqual(getCursor(term), [1, 0]);
      term.writeSync('\x1b[1C');
      assert.deepEqual(getCursor(term), [2, 0]);
      term.writeSync('\x1b[4C');
      assert.deepEqual(getCursor(term), [6, 0]);
      term.writeSync('\x1b[100C');
      assert.deepEqual(getCursor(term), [9, 0]);
      // should not change y
      term.buffer.x = 8;
      term.buffer.y = 4;
      term.writeSync('\x1b[C');
      assert.deepEqual(getCursor(term), [9, 4]);
    });
    it('cursor backward (CUB)', () => {
      term.writeSync('\x1b[D');
      assert.deepEqual(getCursor(term), [0, 0]);
      term.writeSync('\x1b[1D');
      assert.deepEqual(getCursor(term), [0, 0]);
      // place cursor at end of first line
      term.writeSync('\x1b[100C');
      term.writeSync('\x1b[D');
      assert.deepEqual(getCursor(term), [8, 0]);
      term.writeSync('\x1b[1D');
      assert.deepEqual(getCursor(term), [7, 0]);
      term.writeSync('\x1b[4D');
      assert.deepEqual(getCursor(term), [3, 0]);
      term.writeSync('\x1b[100D');
      assert.deepEqual(getCursor(term), [0, 0]);
      // should not change y
      term.buffer.x = 4;
      term.buffer.y = 4;
      term.writeSync('\x1b[D');
      assert.deepEqual(getCursor(term), [3, 4]);
    });
    it('cursor down (CUD)', () => {
      term.writeSync('\x1b[B');
      assert.deepEqual(getCursor(term), [0, 1]);
      term.writeSync('\x1b[1B');
      assert.deepEqual(getCursor(term), [0, 2]);
      term.writeSync('\x1b[4B');
      assert.deepEqual(getCursor(term), [0, 6]);
      term.writeSync('\x1b[100B');
      assert.deepEqual(getCursor(term), [0, 9]);
      // should not change x
      term.buffer.x = 8;
      term.buffer.y = 0;
      term.writeSync('\x1b[B');
      assert.deepEqual(getCursor(term), [8, 1]);
    });
    it('cursor up (CUU)', () => {
      term.writeSync('\x1b[A');
      assert.deepEqual(getCursor(term), [0, 0]);
      term.writeSync('\x1b[1A');
      assert.deepEqual(getCursor(term), [0, 0]);
      // place cursor at beginning of last row
      term.writeSync('\x1b[100B');
      term.writeSync('\x1b[A');
      assert.deepEqual(getCursor(term), [0, 8]);
      term.writeSync('\x1b[1A');
      assert.deepEqual(getCursor(term), [0, 7]);
      term.writeSync('\x1b[4A');
      assert.deepEqual(getCursor(term), [0, 3]);
      term.writeSync('\x1b[100A');
      assert.deepEqual(getCursor(term), [0, 0]);
      // should not change x
      term.buffer.x = 8;
      term.buffer.y = 9;
      term.writeSync('\x1b[A');
      assert.deepEqual(getCursor(term), [8, 8]);
    });
    it('cursor next line (CNL)', () => {
      term.writeSync('\x1b[E');
      assert.deepEqual(getCursor(term), [0, 1]);
      term.writeSync('\x1b[1E');
      assert.deepEqual(getCursor(term), [0, 2]);
      term.writeSync('\x1b[4E');
      assert.deepEqual(getCursor(term), [0, 6]);
      term.writeSync('\x1b[100E');
      assert.deepEqual(getCursor(term), [0, 9]);
      // should reset x to zero
      term.buffer.x = 8;
      term.buffer.y = 0;
      term.writeSync('\x1b[E');
      assert.deepEqual(getCursor(term), [0, 1]);
    });
    it('cursor previous line (CPL)', () => {
      term.writeSync('\x1b[F');
      assert.deepEqual(getCursor(term), [0, 0]);
      term.writeSync('\x1b[1F');
      assert.deepEqual(getCursor(term), [0, 0]);
      // place cursor at beginning of last row
      term.writeSync('\x1b[100E');
      term.writeSync('\x1b[F');
      assert.deepEqual(getCursor(term), [0, 8]);
      term.writeSync('\x1b[1F');
      assert.deepEqual(getCursor(term), [0, 7]);
      term.writeSync('\x1b[4F');
      assert.deepEqual(getCursor(term), [0, 3]);
      term.writeSync('\x1b[100F');
      assert.deepEqual(getCursor(term), [0, 0]);
      // should reset x to zero
      term.buffer.x = 8;
      term.buffer.y = 9;
      term.writeSync('\x1b[F');
      assert.deepEqual(getCursor(term), [0, 8]);
    });
    it('cursor character absolute (CHA)', () => {
      term.writeSync('\x1b[G');
      assert.deepEqual(getCursor(term), [0, 0]);
      term.writeSync('\x1b[1G');
      assert.deepEqual(getCursor(term), [0, 0]);
      term.writeSync('\x1b[2G');
      assert.deepEqual(getCursor(term), [1, 0]);
      term.writeSync('\x1b[5G');
      assert.deepEqual(getCursor(term), [4, 0]);
      term.writeSync('\x1b[100G');
      assert.deepEqual(getCursor(term), [9, 0]);
    });
    it('cursor position (CUP)', () => {
      term.buffer.x = 5;
      term.buffer.y = 5;
      term.writeSync('\x1b[H');
      assert.deepEqual(getCursor(term), [0, 0]);
      term.buffer.x = 5;
      term.buffer.y = 5;
      term.writeSync('\x1b[1H');
      assert.deepEqual(getCursor(term), [0, 0]);
      term.buffer.x = 5;
      term.buffer.y = 5;
      term.writeSync('\x1b[1;1H');
      assert.deepEqual(getCursor(term), [0, 0]);
      term.buffer.x = 5;
      term.buffer.y = 5;
      term.writeSync('\x1b[8H');
      assert.deepEqual(getCursor(term), [0, 7]);
      term.buffer.x = 5;
      term.buffer.y = 5;
      term.writeSync('\x1b[;8H');
      assert.deepEqual(getCursor(term), [7, 0]);
      term.buffer.x = 5;
      term.buffer.y = 5;
      term.writeSync('\x1b[100;100H');
      assert.deepEqual(getCursor(term), [9, 9]);
    });
    it('horizontal position absolute (HPA)', () => {
      term.writeSync('\x1b[`');
      assert.deepEqual(getCursor(term), [0, 0]);
      term.writeSync('\x1b[1`');
      assert.deepEqual(getCursor(term), [0, 0]);
      term.writeSync('\x1b[2`');
      assert.deepEqual(getCursor(term), [1, 0]);
      term.writeSync('\x1b[5`');
      assert.deepEqual(getCursor(term), [4, 0]);
      term.writeSync('\x1b[100`');
      assert.deepEqual(getCursor(term), [9, 0]);
    });
    it('horizontal position relative (HPR)', () => {
      term.writeSync('\x1b[a');
      assert.deepEqual(getCursor(term), [1, 0]);
      term.writeSync('\x1b[1a');
      assert.deepEqual(getCursor(term), [2, 0]);
      term.writeSync('\x1b[4a');
      assert.deepEqual(getCursor(term), [6, 0]);
      term.writeSync('\x1b[100a');
      assert.deepEqual(getCursor(term), [9, 0]);
      // should not change y
      term.buffer.x = 8;
      term.buffer.y = 4;
      term.writeSync('\x1b[a');
      assert.deepEqual(getCursor(term), [9, 4]);
    });
    it('vertical position absolute (VPA)', () => {
      term.writeSync('\x1b[d');
      assert.deepEqual(getCursor(term), [0, 0]);
      term.writeSync('\x1b[1d');
      assert.deepEqual(getCursor(term), [0, 0]);
      term.writeSync('\x1b[2d');
      assert.deepEqual(getCursor(term), [0, 1]);
      term.writeSync('\x1b[5d');
      assert.deepEqual(getCursor(term), [0, 4]);
      term.writeSync('\x1b[100d');
      assert.deepEqual(getCursor(term), [0, 9]);
      // should not change x
      term.buffer.x = 8;
      term.buffer.y = 4;
      term.writeSync('\x1b[d');
      assert.deepEqual(getCursor(term), [8, 0]);
    });
    it('vertical position relative (VPR)', () => {
      term.writeSync('\x1b[e');
      assert.deepEqual(getCursor(term), [0, 1]);
      term.writeSync('\x1b[1e');
      assert.deepEqual(getCursor(term), [0, 2]);
      term.writeSync('\x1b[4e');
      assert.deepEqual(getCursor(term), [0, 6]);
      term.writeSync('\x1b[100e');
      assert.deepEqual(getCursor(term), [0, 9]);
      // should not change x
      term.buffer.x = 8;
      term.buffer.y = 4;
      term.writeSync('\x1b[e');
      assert.deepEqual(getCursor(term), [8, 5]);
    });
    describe('should clamp cursor into addressible range', () => {
      it('CUF', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[C');
        assert.deepEqual(getCursor(term), [9, 9]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[C');
        assert.deepEqual(getCursor(term), [1, 0]);
      });
      it('CUB', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[D');
        assert.deepEqual(getCursor(term), [8, 9]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[D');
        assert.deepEqual(getCursor(term), [0, 0]);
      });
      it('CUD', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[B');
        assert.deepEqual(getCursor(term), [9, 9]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[B');
        assert.deepEqual(getCursor(term), [0, 1]);
      });
      it('CUU', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[A');
        assert.deepEqual(getCursor(term), [9, 8]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[A');
        assert.deepEqual(getCursor(term), [0, 0]);
      });
      it('CNL', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[E');
        assert.deepEqual(getCursor(term), [0, 9]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[E');
        assert.deepEqual(getCursor(term), [0, 1]);
      });
      it('CPL', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[F');
        assert.deepEqual(getCursor(term), [0, 8]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[F');
        assert.deepEqual(getCursor(term), [0, 0]);
      });
      it('CHA', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[5G');
        assert.deepEqual(getCursor(term), [4, 9]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[5G');
        assert.deepEqual(getCursor(term), [4, 0]);
      });
      it('CUP', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[5;5H');
        assert.deepEqual(getCursor(term), [4, 4]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[5;5H');
        assert.deepEqual(getCursor(term), [4, 4]);
      });
      it('HPA', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[5`');
        assert.deepEqual(getCursor(term), [4, 9]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[5`');
        assert.deepEqual(getCursor(term), [4, 0]);
      });
      it('HPR', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[a');
        assert.deepEqual(getCursor(term), [9, 9]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[a');
        assert.deepEqual(getCursor(term), [1, 0]);
      });
      it('VPA', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[5d');
        assert.deepEqual(getCursor(term), [9, 4]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[5d');
        assert.deepEqual(getCursor(term), [0, 4]);
      });
      it('VPR', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[e');
        assert.deepEqual(getCursor(term), [9, 9]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[e');
        assert.deepEqual(getCursor(term), [0, 1]);
      });
      it('DCH', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[P');
        assert.deepEqual(getCursor(term), [9, 9]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[P');
        assert.deepEqual(getCursor(term), [0, 0]);
      });
      it('DCH - should delete last cell', () => {
        term.writeSync('0123456789\x1b[P');
        assert.equal(term.buffer.lines.get(0).translateToString(false), '012345678 ');
      });
      it('ECH', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[X');
        assert.deepEqual(getCursor(term), [9, 9]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[X');
        assert.deepEqual(getCursor(term), [0, 0]);
      });
      it('ECH - should delete last cell', () => {
        term.writeSync('0123456789\x1b[X');
        assert.equal(term.buffer.lines.get(0).translateToString(false), '012345678 ');
      });
      it('ICH', () => {
        term.buffer.x = 10000;
        term.buffer.y = 10000;
        term.writeSync('\x1b[@');
        assert.deepEqual(getCursor(term), [9, 9]);
        term.buffer.x = -10000;
        term.buffer.y = -10000;
        term.writeSync('\x1b[@');
        assert.deepEqual(getCursor(term), [0, 0]);
      });
      it('ICH - should delete last cell', () => {
        term.writeSync('0123456789\x1b[@');
        assert.equal(term.buffer.lines.get(0).translateToString(false), '012345678 ');
      });
    });
  });
  describe('DECSTBM - scroll margins', () => {
    let term: TestTerminal;
    beforeEach(() => {
      term = new TestTerminal({cols: 10, rows: 10});
    });
    it('should default to whole viewport', () => {
      term.writeSync('\x1b[r');
      assert.equal(term.buffer.scrollTop, 0);
      assert.equal(term.buffer.scrollBottom, 9);
      term.writeSync('\x1b[3;7r');
      assert.equal(term.buffer.scrollTop, 2);
      assert.equal(term.buffer.scrollBottom, 6);
      term.writeSync('\x1b[0;0r');
      assert.equal(term.buffer.scrollTop, 0);
      assert.equal(term.buffer.scrollBottom, 9);
    });
    it('should clamp bottom', () => {
      term.writeSync('\x1b[3;1000r');
      assert.equal(term.buffer.scrollTop, 2);
      assert.equal(term.buffer.scrollBottom, 9);
    });
    it('should only apply for top < bottom', () => {
      term.writeSync('\x1b[7;2r');
      assert.equal(term.buffer.scrollTop, 0);
      assert.equal(term.buffer.scrollBottom, 9);
    });
    it('should home cursor', () => {
      term.buffer.x = 10000;
      term.buffer.y = 10000;
      term.writeSync('\x1b[2;7r');
      assert.deepEqual(getCursor(term), [0, 0]);
    });
  });
  describe('scroll margins', () => {
    let term: TestTerminal;
    beforeEach(() => {
      term = new TestTerminal({cols: 10, rows: 10});
    });
    function getLines(term: TestTerminal, limit: number = term.rows): string[] {
      const res: string[] = [];
      for (let i = 0; i < limit; ++i) {
        res.push(term.buffer.lines.get(i).translateToString(true));
      }
      return res;
    }
    it('scrollUp', () => {
      term.writeSync('0\r\n1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7\r\n8\r\n9\x1b[2;4r\x1b[2Sm');
      assert.deepEqual(getLines(term), ['m', '3', '', '', '4', '5', '6', '7', '8', '9']);
    });
    it('scrollDown', () => {
      term.writeSync('0\r\n1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7\r\n8\r\n9\x1b[2;4r\x1b[2Tm');
      assert.deepEqual(getLines(term), ['m', '', '', '1', '4', '5', '6', '7', '8', '9']);
    });
    it('insertLines - out of margins', () => {
      term.writeSync('0\r\n1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7\r\n8\r\n9\x1b[3;6r');
      assert.equal(term.buffer.scrollTop, 2);
      assert.equal(term.buffer.scrollBottom, 5);
      term.writeSync('\x1b[2Lm');
      assert.deepEqual(getLines(term), ['m', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
      term.writeSync('\x1b[2H\x1b[2Ln');
      assert.deepEqual(getLines(term), ['m', 'n', '2', '3', '4', '5', '6', '7', '8', '9']);
      // skip below scrollbottom
      term.writeSync('\x1b[7H\x1b[2Lo');
      assert.deepEqual(getLines(term), ['m', 'n', '2', '3', '4', '5', 'o', '7', '8', '9']);
      term.writeSync('\x1b[8H\x1b[2Lp');
      assert.deepEqual(getLines(term), ['m', 'n', '2', '3', '4', '5', 'o', 'p', '8', '9']);
      term.writeSync('\x1b[100H\x1b[2Lq');
      assert.deepEqual(getLines(term), ['m', 'n', '2', '3', '4', '5', 'o', 'p', '8', 'q']);
    });
    it('insertLines - within margins', () => {
      term.writeSync('0\r\n1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7\r\n8\r\n9\x1b[3;6r');
      assert.equal(term.buffer.scrollTop, 2);
      assert.equal(term.buffer.scrollBottom, 5);
      term.writeSync('\x1b[3H\x1b[2Lm');
      assert.deepEqual(getLines(term), ['0', '1', 'm', '', '2', '3', '6', '7', '8', '9']);
      term.writeSync('\x1b[6H\x1b[2Ln');
      assert.deepEqual(getLines(term), ['0', '1', 'm', '', '2', 'n', '6', '7', '8', '9']);
    });
    it('deleteLines - out of margins', () => {
      term.writeSync('0\r\n1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7\r\n8\r\n9\x1b[3;6r');
      assert.equal(term.buffer.scrollTop, 2);
      assert.equal(term.buffer.scrollBottom, 5);
      term.writeSync('\x1b[2Mm');
      assert.deepEqual(getLines(term), ['m', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
      term.writeSync('\x1b[2H\x1b[2Mn');
      assert.deepEqual(getLines(term), ['m', 'n', '2', '3', '4', '5', '6', '7', '8', '9']);
      // skip below scrollbottom
      term.writeSync('\x1b[7H\x1b[2Mo');
      assert.deepEqual(getLines(term), ['m', 'n', '2', '3', '4', '5', 'o', '7', '8', '9']);
      term.writeSync('\x1b[8H\x1b[2Mp');
      assert.deepEqual(getLines(term), ['m', 'n', '2', '3', '4', '5', 'o', 'p', '8', '9']);
      term.writeSync('\x1b[100H\x1b[2Mq');
      assert.deepEqual(getLines(term), ['m', 'n', '2', '3', '4', '5', 'o', 'p', '8', 'q']);
    });
    it('deleteLines - within margins', () => {
      term.writeSync('0\r\n1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7\r\n8\r\n9\x1b[3;6r');
      assert.equal(term.buffer.scrollTop, 2);
      assert.equal(term.buffer.scrollBottom, 5);
      term.writeSync('\x1b[6H\x1b[2Mm');
      assert.deepEqual(getLines(term), ['0', '1', '2', '3', '4', 'm', '6', '7', '8', '9']);
      term.writeSync('\x1b[3H\x1b[2Mn');
      assert.deepEqual(getLines(term), ['0', '1', 'n', 'm',  '',  '', '6', '7', '8', '9']);
    });
  });
});
