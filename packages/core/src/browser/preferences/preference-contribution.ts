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

import * as Ajv from 'ajv';
import { inject, injectable, named, interfaces } from 'inversify';
import { ContributionProvider, bindContributionProvider } from '../../common';
import { PreferenceProvider } from './preference-provider';

// tslint:disable:no-any

export const PreferenceContribution = Symbol('PreferenceContribution');
export interface PreferenceContribution {
    readonly schema: PreferenceSchema;
}

export const PreferenceSchema = Symbol('PreferenceSchema');

export interface PreferenceSchema {
    [name: string]: Object,
    properties: {
        [name: string]: PreferenceProperty
    }
}

export interface PreferenceProperty {
    description: string;
    type?: JsonType | JsonType[];
    minimum?: number;
    // tslint:disable-next-line:no-any
    default?: any;
    enum?: string[];
    additionalProperties?: object;
    // tslint:disable-next-line:no-any
    [name: string]: any;
}

export type JsonType = 'string' | 'array' | 'number' | 'integer' | 'object' | 'boolean' | 'null';

export function bindPreferenceSchemaProvider(bind: interfaces.Bind): void {
    bind(PreferenceSchemaProvider).toSelf().inSingletonScope();
    bindContributionProvider(bind, PreferenceContribution);
}

@injectable()
export class PreferenceSchemaProvider extends PreferenceProvider {

    protected readonly combinedSchema: PreferenceSchema = { properties: {} };
    protected readonly preferences: { [name: string]: any } = {};
    protected readonly validateFunction: Ajv.ValidateFunction;

    constructor(
        @inject(ContributionProvider) @named(PreferenceContribution)
        protected readonly preferenceContributions: ContributionProvider<PreferenceContribution>
    ) {
        super();
        const schema = this.combinedSchema;
        this.preferenceContributions.getContributions().forEach(contrib => {
            for (const property in contrib.schema.properties) {
                if (schema.properties[property]) {
                    console.error('Preference name collision detected in the schema for property: ' + property);
                } else {
                    schema.properties[property] = contrib.schema.properties[property];
                }
            }
        });
        this.validateFunction = new Ajv().compile(schema);
        // tslint:disable-next-line:forin
        for (const property in schema.properties) {
            this.preferences[property] = schema.properties[property].default;
        }
        this._ready.resolve();
    }

    validate(name: string, value: any): boolean {
        return this.validateFunction({ [name]: value }) as boolean;
    }

    getCombinedSchema(): PreferenceSchema {
        return this.combinedSchema;
    }

    getPreferences(): { [name: string]: any } {
        return this.preferences;
    }

    async setPreference(): Promise<void> {
        throw new Error('Unsupported');
    }

}
