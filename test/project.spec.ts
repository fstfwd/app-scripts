// tslint:disable: no-any
import { expect } from 'chai';
import {
  ServiceMocking,
  ServiceStubing,
  mockService,
  rewireFull,
} from '@lamnhan/testea';

import { ProjectService } from '../src/lib/services/project';

describe('services/project.ts', () => {
  
  // @src/services/file
  const mockedFileService = {
    readJson: async () => ({ name: 'xxx' }),
  };

  // setup test
  async function setup<
    ServiceStubs extends ServiceStubing<ProjectService>,
    FileServiceMocks extends ServiceMocking<typeof mockedFileService>
  >(
    serviceStubs?: ServiceStubs,
    serviceMocks: {
      fileServiceMocks?: FileServiceMocks;
    } = {}
  ) {
    const { fileServiceMocks = {} } = serviceMocks;
    return rewireFull(
      // rewire the module
      '@lib/services/project',
      undefined,
      // rewire the service
      ProjectService,
      {
        '@lib/services/file': mockService({
          ...mockedFileService,
          ...fileServiceMocks,
        }),
      },
      serviceStubs
    ).getResult();
  }

  it('#getPackageJson', async () => {
    const {
      service,
      mockedServices: { '@lib/services/file': fileServiceTesting },
    } = await setup();

    const result = await service.getPackageJson();
    expect(result).eql({ name: 'xxx' });
    expect(fileServiceTesting.getResult('readJson').getArgs()).eql(['package.json']);
  });

  it('#getConfigs (module)', async () => {
    const { service } = await setup({
      getPackageJson: async () => ({ name: '@sheetbase/xxx' }),
    });

    const result = await service.getConfigs();
    expect(result).eql({
      type: 'module',
      name: 'xxx',
      fullName: 'sheetbase-xxx',
      inputPath: './dist/src/public-api.js',
      umdPath: './dist/sheetbase-xxx.js',
      umdName: 'Xxx',
      esmPath: './dist/sheetbase-xxx.esm.js',
      typingsPath: './dist/sheetbase-xxx.d.ts',
    });
  });

  it('#getConfigs (app 1)', async () => {
    const { service } = await setup({
      getPackageJson: async () => ({ name: '@sheetbase/backend' }),
    });
    const result = await service.getConfigs();
    expect(result).eql({
      type: 'app',
      name: 'backend',
      fullName: 'sheetbase-backend',
      inputPath: './dist/src/index.js',
      umdPath: './dist/app.js',
      umdName: 'App',
    });
  });

  it('#getConfigs (app 2)', async () => {
    const { service } = await setup({
      getPackageJson: async () => ({ name: '@app/xxx' }),
    });
    const result = await service.getConfigs();
    expect(result.type).equal('app');
  });
});
