import { EDeviceStatus } from '@common/enums';
import {
  DeviceEntity,
  DeviceLocationEntity,
  DeviceTypeEntity,
  UserEntity,
} from '@entities';
import { faker } from '@faker-js/faker';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class DeviceSeeder {
  private readonly logger = new Logger(DeviceSeeder.name);

  // Sample device names by type
  private readonly deviceNamesByType: Record<string, string[]> = {
    Laptop: [
      'MacBook Pro 14"',
      'MacBook Air M2',
      'Dell XPS 15',
      'ThinkPad X1 Carbon',
      'HP EliteBook 840',
      'ASUS ZenBook 14',
      'Microsoft Surface Laptop',
      'Acer Swift 3',
    ],
    Desktop: [
      'Dell OptiPlex 7090',
      'HP ProDesk 400',
      'Lenovo ThinkCentre M70s',
      'Apple iMac 24"',
      'ASUS ExpertCenter',
      'Acer Veriton',
    ],
    Monitor: [
      'Dell UltraSharp U2722D',
      'LG 27UK850-W',
      'Samsung Odyssey G7',
      'ASUS ProArt PA278CV',
      'BenQ PD2700U',
      'HP Z27',
      'ViewSonic VP2768',
    ],
    Printer: [
      'HP LaserJet Pro M404n',
      'Canon imageCLASS MF445dw',
      'Brother HL-L2350DW',
      'Epson EcoTank ET-4760',
      'Xerox B210',
    ],
    Projector: [
      'Epson PowerLite 1785W',
      'BenQ MH535FHD',
      'ViewSonic PX701HD',
      'Optoma HD146X',
      'Sony VPL-VW295ES',
    ],
    Camera: [
      'Logitech C920',
      'Logitech Brio',
      'Razer Kiyo Pro',
      'Microsoft LifeCam HD-3000',
      'Elgato Facecam',
    ],
    Network: [
      'Cisco Catalyst 2960',
      'TP-Link TL-SG108',
      'Netgear ProSAFE',
      'Ubiquiti UniFi Switch',
      'D-Link DGS-1100',
    ],
    Server: [
      'Dell PowerEdge R740',
      'HP ProLiant DL380',
      'Lenovo ThinkSystem SR650',
      'Supermicro SuperServer',
      'Cisco UCS C220',
    ],
    Other: [
      'USB Hub 7-Port',
      'Docking Station',
      'External SSD 1TB',
      'Wireless Keyboard',
      'Wireless Mouse',
      'Headset',
      'Webcam Stand',
      'Cable Organizer',
    ],
  };

  private readonly suppliers = [
    'Dell Technologies',
    'HP Inc.',
    'Lenovo',
    'Apple Inc.',
    'ASUS',
    'Acer',
    'Samsung Electronics',
    'LG Electronics',
    'Canon',
    'Epson',
    'Cisco Systems',
    'Microsoft',
    'Logitech',
  ];

  constructor(
    @InjectModel(DeviceEntity)
    private readonly deviceModel: typeof DeviceEntity,
    @InjectModel(DeviceTypeEntity)
    private readonly deviceTypeModel: typeof DeviceTypeEntity,
    @InjectModel(DeviceLocationEntity)
    private readonly deviceLocationModel: typeof DeviceLocationEntity,
    @InjectModel(UserEntity)
    private readonly userModel: typeof UserEntity,
  ) {}

  /**
   * Seed device types if not exists
   * @returns Created device type entities
   */
  async seedDeviceTypes(): Promise<DeviceTypeEntity[]> {
    this.logger.log('Seeding device types...');

    const existingTypes = await this.deviceTypeModel.findAll();
    if (existingTypes.length > 0) {
      this.logger.log('Device types already exist');
      return existingTypes;
    }

    const users = await this.userModel.findAll({
      attributes: ['id'],
      limit: 1,
    });

    const createdById = users.length > 0 ? users[0].id : undefined;

    const deviceTypes = Object.keys(this.deviceNamesByType).map((typeName) => ({
      deviceTypeName: typeName,
      description: faker.lorem.sentence(),
      status: 1,
      createdById,
      updatedById: createdById,
    }));

    const createdTypes = await this.deviceTypeModel.bulkCreate(
      deviceTypes as DeviceTypeEntity[],
      {
        ignoreDuplicates: true,
      },
    );

    this.logger.log(`Successfully seeded ${createdTypes.length} device types`);
    return createdTypes;
  }

  /**
   * Seed devices with random data
   * @param count Number of devices to create
   * @returns Created device entities
   */
  async seed(count: number = 50): Promise<DeviceEntity[]> {
    this.logger.log(`Seeding ${count} devices...`);

    // Ensure device types exist
    let deviceTypes = await this.deviceTypeModel.findAll();
    if (deviceTypes.length === 0) {
      deviceTypes = await this.seedDeviceTypes();
    }

    // Get existing users for createdBy field
    const users = await this.userModel.findAll({
      attributes: ['id'],
      limit: 10,
    });

    if (users.length === 0) {
      this.logger.warn('No users found. Please seed users first.');
      return [];
    }

    // Get existing locations (optional)
    const locations = await this.deviceLocationModel.findAll({
      attributes: ['id'],
      limit: 20,
    });

    const userIds = users.map((user) => user.id);
    const locationIds = locations.map((loc) => loc.id);

    const devices: Partial<DeviceEntity>[] = [];

    for (let i = 0; i < count; i++) {
      const deviceType = faker.helpers.arrayElement(deviceTypes);
      const deviceNames =
        this.deviceNamesByType[deviceType.deviceTypeName] ||
        this.deviceNamesByType['Other'];
      const randomUserId = faker.helpers.arrayElement(userIds);

      // Generate purchase date (within last 3 years)
      const purchaseDate = faker.date.past({ years: 3 });
      // Warranty expiration: 1-3 years after purchase
      const warrantyYears = faker.number.int({ min: 1, max: 3 });
      const warrantyExpirationDate = new Date(purchaseDate);
      warrantyExpirationDate.setFullYear(
        warrantyExpirationDate.getFullYear() + warrantyYears,
      );

      devices.push({
        deviceName: faker.helpers.arrayElement(deviceNames),
        serial: faker.string.alphanumeric({ length: 12 }).toUpperCase(),
        model: faker.helpers.arrayElement([
          faker.string.alphanumeric({ length: 8 }).toUpperCase(),
          `${faker.string.alpha({ length: 2 }).toUpperCase()}-${faker.number.int({ min: 1000, max: 9999 })}`,
          undefined,
        ]),
        deviceTypeId: deviceType.id,
        supplier: faker.helpers.arrayElement(this.suppliers),
        deviceLocationId:
          locationIds.length > 0 && faker.datatype.boolean({ probability: 0.7 })
            ? faker.helpers.arrayElement(locationIds)
            : null,
        status: 1,
        purchaseDate,
        warrantyExpirationDate,
        note: faker.datatype.boolean({ probability: 0.3 })
          ? faker.lorem.sentence()
          : undefined,
        createdById: randomUserId,
        updatedById: randomUserId,
      });
    }

    const createdDevices = await this.deviceModel.bulkCreate(
      devices as DeviceEntity[],
      {
        ignoreDuplicates: true,
      },
    );

    this.logger.log(`Successfully seeded ${createdDevices.length} devices`);
    return createdDevices;
  }

  /**
   * Seed devices by type
   * @param typeName Device type name
   * @param count Number of devices to create
   * @returns Created device entities
   */
  async seedByType(
    typeName: string,
    count: number = 10,
  ): Promise<DeviceEntity[]> {
    this.logger.log(`Seeding ${count} devices of type ${typeName}...`);

    const deviceType = await this.deviceTypeModel.findOne({
      where: { deviceTypeName: typeName },
    });

    if (!deviceType) {
      this.logger.warn(`Device type "${typeName}" not found`);
      return [];
    }

    const users = await this.userModel.findAll({
      attributes: ['id'],
      limit: 10,
    });

    if (users.length === 0) {
      this.logger.warn('No users found. Please seed users first.');
      return [];
    }

    const userIds = users.map((user) => user.id);
    const deviceNames =
      this.deviceNamesByType[typeName] || this.deviceNamesByType['Other'];

    const devices: Partial<DeviceEntity>[] = [];

    for (let i = 0; i < count; i++) {
      const randomUserId = faker.helpers.arrayElement(userIds);
      const purchaseDate = faker.date.past({ years: 3 });
      const warrantyExpirationDate = new Date(purchaseDate);
      warrantyExpirationDate.setFullYear(
        warrantyExpirationDate.getFullYear() +
          faker.number.int({ min: 1, max: 3 }),
      );

      devices.push({
        deviceName: faker.helpers.arrayElement(deviceNames),
        serial: faker.string.alphanumeric({ length: 12 }).toUpperCase(),
        model: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
        deviceTypeId: deviceType.id,
        supplier: faker.helpers.arrayElement(this.suppliers),
        status: EDeviceStatus.AVAILABLE,
        purchaseDate,
        warrantyExpirationDate,
        createdById: randomUserId,
        updatedById: randomUserId,
      });
    }

    const createdDevices = await this.deviceModel.bulkCreate(
      devices as DeviceEntity[],
      {
        ignoreDuplicates: true,
      },
    );

    this.logger.log(`Successfully seeded ${createdDevices.length} devices`);
    return createdDevices;
  }

  /**
   * Clear all seeded devices
   */
  async clear(): Promise<void> {
    this.logger.log('Clearing all devices...');
    await this.deviceModel.destroy({
      where: {},
      force: true,
    });
    this.logger.log('Devices cleared');
  }

  /**
   * Clear all device types
   */
  async clearDeviceTypes(): Promise<void> {
    this.logger.log('Clearing all device types...');
    await this.deviceTypeModel.destroy({
      where: {},
      force: true,
    });
    this.logger.log('Device types cleared');
  }

  /**
   * Get random device IDs
   * @param count Number of random device IDs to get
   * @returns Array of device IDs
   */
  async getRandomDeviceIds(count: number): Promise<string[]> {
    const devices = await this.deviceModel.findAll({
      attributes: ['id'],
      where: { status: EDeviceStatus.AVAILABLE },
      order: this.deviceModel.sequelize?.random(),
      limit: count,
    });
    return devices.map((device) => device.id);
  }
}
