/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface Asset {
  eventType: string;
  network: {
    id: string;
  };
  data: {
    id: string;
    /**
     * Currently supported type ['chargingStation']
     */
    type: string;
    network: {
      id: string;
    };
    assetGroup: {
      id: string;
    };
    sitePartners: {
      id: string;
    }[];
    /**
     * if type is chargingStation you can assume that the location object is defined
     */
    chargingStation?: {
      serialNumber: string;
      name: string;
      rate: string;
      status: string;
      connectors: {
        id: number;
        isActive: boolean;
        connectionType: string;
        format: string;
        maxAmperage: number;
        maxVoltage: number;
        updatedAt: string;
      }[];
      localAuthorization: boolean;
      geoLocation: {
        type: string;
        /**
         * @minItems 2
         * @maxItems 2
         */
        coordinates: [number, number];
      };
      powerType: string;
      protocol?: string | null;
      images?:
        | {
            url: string;
            category: string;
            imgType: string;
            thumbnail?: string;
          }[]
        | null;
      manufacturingInfo?: {
        chargePointVendor: string;
        chargePointModel: string;
        chargePointSerialNumber?: string;
        chargeBoxSerialNumber?: string;
        firmwareVersion?: string;
        imsi?: string;
        meterType?: string;
        meterSerialNumber?: string;
      } | null;
      reason?: string | null;
      lastHeartbeat?: string | null;
      sortOrder?: number | null;
      directionHint?: string | null;
      simInfo?: {
        iccid: string;
        fleet?: string;
        createdAt: string;
      } | null;
      supportsSimultaneousCharging?: boolean | null;
      paymentTerminal?: {
        id: string;
        serialNumber: string;
        provider: string;
        integrationType: string;
        /**
         * This field is deprecated and should be ignored. It is the down stream services responsibility to create and manage a PAYMENT_TERMINAL token when appropriate
         */
        authorizationIdTag?: string;
        /**
         * The amount to pre authorization in the lowest denomination of the currency
         */
        preAuthAmount: number;
      } | null;
      shortCode?: string | null;
    };
    createdAt: string;
    updatedAt: string;
  };
}
