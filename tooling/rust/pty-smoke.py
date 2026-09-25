#!/usr/bin/env python3
"""Unix PTY acceptance: live GPU, controls, resize, q/Ctrl-C/SIGTERM and termios restoration."""
import errno
import fcntl
import os
from pathlib import Path
import pty
import select
import signal
import struct
import subprocess
import sys
import termios
import time

program = str(Path(sys.argv[1] if len(sys.argv) > 1 else 'target/debug/blackhole').resolve())
for exit_method in ('q', 'ctrl-c', 'sigterm'):
    master, slave = pty.openpty()
    fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack('HHHH', 24, 100, 0, 0))
    original = termios.tcgetattr(slave)
    env = {k: v for k, v in os.environ.items() if k != 'NO_COLOR'}
    env.update(TERM='xterm-256color', COLORTERM='truecolor')
    child = subprocess.Popen([program], stdin=slave, stdout=slave, stderr=slave, start_new_session=True, env=env)
    output = bytearray()
    def drain(timeout=0.1):
        if select.select([master], [], [], timeout)[0]:
            try:
                data = os.read(master, 65536)
                output.extend(data)
                if b'\x1b[6n' in data:
                    os.write(master, b'\x1b[1;1R')
            except OSError as e:
                if e.errno != errno.EIO: raise
    def wait_for(needle, timeout=30):
        deadline = time.monotonic() + timeout
        while needle not in output:
            drain()
            if child.poll() is not None or time.monotonic() > deadline:
                raise AssertionError(f'Missing {needle!r}: {output[-3000:]!r}')
    try:
        wait_for(b'Blackhole')
        assert not termios.tcgetattr(slave)[3] & termios.ICANON, 'raw mode was not enabled'
        wait_for(b'GPU')
        # Give asynchronous shader frames time to arrive, then require true-color cells.
        wait_for(b'38;2;')
        os.write(master, b'w2].+?')
        wait_for(b'W/S')
        os.write(master, b'?r')
        fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack('HHHH', 32, 120, 0, 0))
        deadline = time.monotonic() + 0.5
        while time.monotonic() < deadline: drain()
        if exit_method == 'sigterm': os.kill(child.pid, signal.SIGTERM)
        else: os.write(master, b'q' if exit_method == 'q' else b'\x03')
        deadline = time.monotonic() + 8
        while child.poll() is None and time.monotonic() < deadline: drain()
        assert child.poll() == 0, f'Exit failed ({exit_method}): {child.poll()}; tail={output[-1000:]!r}'
        for _ in range(3): drain(0.02)
        assert b'\x1b[?1049l' in output, 'alternate screen not restored'
        assert b'\x1b[?25h' in output, 'cursor not restored'
        assert termios.tcgetattr(slave) == original, 'termios not restored'
        print(f'PASS {exit_method}: live GPU, navigation, settings, help, resize, raw mode/cursor/screen restoration')
    finally:
        if child.poll() is None: child.kill(); child.wait()
        os.close(master)
        os.close(slave)
