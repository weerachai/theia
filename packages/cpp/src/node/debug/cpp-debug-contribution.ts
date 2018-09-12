/********************************************************************************
 * Copyright (C) 2018 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

const path = require('path');
const packageJson = require('../../../package.json');
const debugAdapterDir = packageJson['debugAdapter']['dir'];

import { injectable } from 'inversify';
import { DebugConfiguration } from '@theia/debug/lib/common/debug-common';
import { DebugAdapterContribution, DebugAdapterExecutable } from '@theia/debug/lib/node/debug-model';

@injectable()
export class GdbDebugAdapterContribution implements DebugAdapterContribution {

    readonly debugType = 'gdb';
    readonly filePatterns = [
        '[.]c$',
        '[.]cpp$',
        '[.]d$',
        '[.]objective-c$',
        '[.]fortran$',
        '[.]fortran-modern$',
        '[.]fortran90$',
        '[.]fortran_free-form$',
        '[.]fortran_fixed-form$',
        '[.]rust$',
        '[.]pascal$',
        '[.]objectpascal$',
        '[.]ada$',
        '[.]nim$',
        '[.]arm$',
        '[.]asm$',
        '[.]vala$',
        '[.]crystal$',
    ];

    provideDebugConfigurations = [{
        type: this.debugType,
        breakpoints: { filePatterns: this.filePatterns },
        request: 'attach',
        name: 'Attach by PID',
        processId: '',
        cwd: '',
    }];

    resolveDebugConfiguration(config: DebugConfiguration): DebugConfiguration {
        if (!config.cwd) {
            throw new Error('Debug request CWD must be set!');
        }

        config.breakpoints = {
            filePatterns: this.filePatterns
        };

        if (!config.request) {
            throw new Error('Debug request type is not provided.');
        }

        switch (config.request) {
            case 'attach': this.validateAttachConfig(config);
        }

        return config;
    }

    provideDebugAdapterExecutable(config: DebugConfiguration): DebugAdapterExecutable {
        const program = path.join(__dirname, `../../../${debugAdapterDir}/out/src/gdb.js`);
        return {
            program,
            runtime: 'node',
        };
    }

    private validateAttachConfig(config: DebugConfiguration) {
        if (!config.target) {
            config.target = config.processId;
        }
        if (!config.target) {
            throw new Error('PID is not provided.');
        }

        // GDB takes the processId as `target`
        config.target = config.processId;
    }
}
