// tslint:disable: no-any
import { expect } from 'chai';
import { sinon, mockModule, rewireFull } from '@lamnhan/testea';

import { Cli } from '../src/cli/index';

describe('cli.ts', () => {
  
  // commander
  const mockedCommanderModule = {
    version: '*',
    usage: '*',
    description: '*',
    command: '*',
    option: '*',
    action: '*',
    outputHelp: '#outputHelp',
  };

  // @commands/build
  class MockedBuildCommand {
    async run(options: any) {
      return { run: options };
    }
  }

  // setup test
  async function setup() {
    return rewireFull(
      // rewire the module
      '@cli/index',
      {
        '~commander': mockModule(mockedCommanderModule),
        '@lib/services/file': { FileService: class {} },
        '@lib/services/message': { MessageService: class {} },
        '@lib/services/typedoc': { TypedocService: class {} },
        '@lib/services/project': { ProjectService: class {} },
        '@lib/services/rollup': { RollupService: class {} },
        '@lib/services/content': { ContentService: class {} },
        '@cli/commands/build': { BuildCommand: MockedBuildCommand },
      },
      // rewire the service
      Cli
    ).getResult();
  }

  it('#cli', async () => {
    const {
      mockedModules: { '~commander': commanderModuleTesting },
      service,
    } = await setup();

    const result = service.getApp();
    // retrieve data
    const version = require('../package.json').version;
    const versionArgs = commanderModuleTesting.getResult('version').getArgs();
    const usageArgs = commanderModuleTesting.getResult('usage').getArgs();
    const descriptionStkArgs = commanderModuleTesting.getResult('description').getStackedArgs();
    const commandStkArgs = commanderModuleTesting.getResult('command').getStackedArgs();
    const optionStkArgs = commanderModuleTesting.getResult('option').getStackedArgs();
    const buildCommand = commanderModuleTesting.getResult('action').getArgInStack(1, 1);
    const helpCommand = commanderModuleTesting.getResult('action').getArgInStack(2, 1);
    const anyCommand = commanderModuleTesting.getResult('action').getArgInStack(3, 1);
    // commander data
    expect(versionArgs).eql([version, '-v, --version']);
    expect(usageArgs).eql(['sheetbase-app-scripts [options] [command]']);
    expect(descriptionStkArgs).eql([
      ['Scripts for Sheetbase backend modules and apps.'],
      ['Build distribution package.'],
      ['Display help.'],
      ['Any other command is not supported.'],
    ]);
    expect(commandStkArgs).eql([['build'], ['help'], ['*']]);
    expect(optionStkArgs).eql([
      // build command
      ['--copy [value]', 'Copied resources, comma-seperated.'],
      ['--vendor [value]', 'Files for @vendor.js, comma-seperated.'],
    ]);
    // build command result
    const buildCommandResult = await buildCommand({ options: true });
    expect(buildCommandResult).eql({ run: { options: true } });
    // help command result
    const helpCommandResult = await helpCommand();
    expect(helpCommandResult).equal('#outputHelp');
    // * command result
    const errorStub = sinon.stub(console, 'error').callsFake((value: any) => value);
    const anyCommandResult = await anyCommand('xxx');
    expect(anyCommandResult).equal(
      `\u001b[31mUnknown command \'xxx\'\u001b[39m`
    );
    errorStub.restore();
  });
});
