"use client";
import { useState } from "react";
import { saveAs } from "file-saver";
import Link from "next/link";
import Image from "next/image";
import React from "react";

interface Compartment {
  codeId: string;
  humanReadableId: string;
  sensorAreaExternalIds: string[];
}

interface Sensor {
  sensorUnitHardwareId: string;
  pinId: string;
}

interface SensorArea {
  externalId: string;
  sensors: Sensor[];
}

interface FormData {
  codeId: string;
  humanReadableId: string;
  modelExternalId: string;
  hardwareVersion: string;
  retailerExternalId: string;
  activated: boolean;
  hardwareId: string;
  bluetoothId: string;
  compartments: Compartment[];
  sensorAreas: SensorArea[];
}

function isCompartmentsOrSensorAreas(
  section: keyof FormData
): section is "compartments" | "sensorAreas" {
  return section === "compartments" || section === "sensorAreas";
}

const XmlForm = () => {
  const [formData, setFormData] = useState<FormData>({
    codeId: "",
    humanReadableId: "",
    modelExternalId: "",
    hardwareVersion: "",
    retailerExternalId: "",
    activated: true,
    hardwareId: "",
    bluetoothId: "",
    compartments: [
      {
        codeId: "",
        humanReadableId: "COMPARTMENT_1",
        sensorAreaExternalIds: ["", "", "", ""],
      },
    ],
    sensorAreas: [
      { externalId: "", sensors: [{ sensorUnitHardwareId: "", pinId: "" }] },
    ],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    section?: keyof FormData,
    index?: number,
    subIndex?: number
  ) => {
    const { name, value, type, checked } = e.target;

    setFormData((prevFormData) => {
      let codeId = { ...prevFormData };

      if (section && isCompartmentsOrSensorAreas(section)) {
        if (section === "compartments") {
          codeId.compartments = codeId.compartments.map((item, i) => {
            if (i === index) {
              if (name === "sensorAreaExternalIds" && subIndex !== undefined) {
                const newSensorAreaExternalIds = [
                  ...item.sensorAreaExternalIds,
                ];
                newSensorAreaExternalIds[subIndex] = value;
                return {
                  ...item,
                  sensorAreaExternalIds: newSensorAreaExternalIds,
                };
              } else {
                return {
                  ...item,
                  [name]: type === "checkbox" ? checked : value,
                };
              }
            }
            return item;
          });
        } else if (section === "sensorAreas") {
          codeId.sensorAreas = codeId.sensorAreas.map((item, i) => {
            if (i === index) {
              if (subIndex !== undefined && name in item) {
                const currentItem = item as any;
                if (Array.isArray(currentItem[name])) {
                  currentItem[name][subIndex] = value;
                } else {
                  currentItem[name] = type === "checkbox" ? checked : value;
                }
              } else {
                return {
                  ...item,
                  [name]: type === "checkbox" ? checked : value,
                };
              }
            }
            return item;
          });
        }
      } else if (!section) {
        codeId = {
          ...codeId,
          [name]: type === "checkbox" ? checked : value,
        };

        // Auto-population logic
        if (name === "modelExternalId") {
          codeId.hardwareId = `${value}`;
          codeId.bluetoothId = `MS-${value}`;
        }

        if (name === "modelExternalId") {
          codeId.hardwareVersion = `${value}.v1`;
        }

        // Update compartments and sensor areas
        // Update compartments and sensor areas
        codeId.compartments = codeId.compartments.map((compartment, index) => ({
          ...compartment,
          codeId: `${prevFormData.codeId}@COMPARTMENT_${index + 1}`,
          sensorAreaExternalIds: [
            `SENSOR_AREA_${prevFormData.codeId}~0-${index * 4 + 1}`,
            `SENSOR_AREA_${prevFormData.codeId}~0-${index * 4 + 2}`,
            `SENSOR_AREA_${prevFormData.codeId}~0-${index * 4 + 3}`,
            `SENSOR_AREA_${prevFormData.codeId}~0-${index * 4 + 4}`,
          ],
        }));

        codeId.sensorAreas = codeId.sensorAreas.map((sensorArea, index) => ({
          ...sensorArea,
          externalId: `SENSOR_AREA_${prevFormData.codeId}~0-${index + 1}`,
          sensors: sensorArea.sensors.map((sensor) => ({
            ...sensor,
            sensorUnitHardwareId: codeId.hardwareId,
            pinId: `0-${index + 1}`,
          })),
        }));
      }

      return codeId;
    });
  };

  const addCompartment = () => {
    const newCompartmentIndex = formData.compartments.length + 1;
    setFormData({
      ...formData,
      compartments: [
        ...formData.compartments,
        {
          codeId: `${formData.codeId}@COMPARTMENT_${newCompartmentIndex}`,
          humanReadableId: `COMPARTMENT_${newCompartmentIndex}`,
          sensorAreaExternalIds: [
            `SENSOR_AREA_${formData.codeId}~0-${
              (newCompartmentIndex - 1) * 4 + 1
            }`,
            `SENSOR_AREA_${formData.codeId}~0-${
              (newCompartmentIndex - 1) * 4 + 2
            }`,
            `SENSOR_AREA_${formData.codeId}~0-${
              (newCompartmentIndex - 1) * 4 + 3
            }`,
            `SENSOR_AREA_${formData.codeId}~0-${
              (newCompartmentIndex - 1) * 4 + 4
            }`,
          ],
        },
      ],
    });
  };

  const deleteCompartment = () => {
    setFormData({
      ...formData,
      compartments: formData.compartments.slice(0, -1),
    });
  };

  const addSensorArea = () => {
    const newSensorAreaIndex = formData.sensorAreas.length + 1;
    setFormData({
      ...formData,
      sensorAreas: [
        ...formData.sensorAreas,
        {
          externalId: `SENSOR_AREA_${formData.codeId}~0-${newSensorAreaIndex}`,
          sensors: [
            {
              sensorUnitHardwareId: formData.hardwareId,
              pinId: `0-${newSensorAreaIndex}`,
            },
          ],
        },
      ],
    });
  };

  const deleteSensorArea = () => {
    setFormData({
      ...formData,
      sensorAreas: formData.sensorAreas.slice(0, -1),
    });
  };

  const generateXML = () => {
    const xml = `
    <?xml version='1.0' encoding='utf-8'?>
      <Import>
        <storageUnits>
          <storageUnit>
            <codeId>${formData.codeId}</codeId>
            <humanReadableId>${formData.humanReadableId}</humanReadableId>
            <modelExternalId>${formData.modelExternalId}</modelExternalId>
            <hardwareVersion>${formData.hardwareVersion}</hardwareVersion>
            <retailerExternalId>${
              formData.retailerExternalId
            }</retailerExternalId>
            <activated>${formData.activated}</activated>
            <sensorUnits>
              <sensorUnit>
                <hardwareId>${formData.hardwareId}</hardwareId>
                <bluetoothId>${formData.bluetoothId}</bluetoothId>
              </sensorUnit>
            </sensorUnits>
          </storageUnit>
        </storageUnits>
        <compartments>
        ${formData.compartments
          .map(
            (compartment, index) =>
              `
          <Compartment>
            <codeId>${compartment.codeId}</codeId>
            <storageUnitCodeId>${formData.codeId}</storageUnitCodeId>
            <humanReadableId>${compartment.humanReadableId}</humanReadableId>
            <sensorAreaExternalIds>
              ${compartment.sensorAreaExternalIds
                .map(
                  (id) => `
              <Id>${id}</Id>`
                )
                .join("")}
            </sensorAreaExternalIds>
          </Compartment>
        `
          )
          .join("")}
      </compartments>
        <sensorUnits>
          <sensorUnit>
            <hardwareId>${formData.hardwareId}</hardwareId>
            <bluetoothId>${formData.bluetoothId}</bluetoothId>
            <hardwareVersion>${formData.hardwareVersion}</hardwareVersion>
            <activated>${formData.activated}</activated>
          </sensorUnit>
        </sensorUnits>
        <sensorAreas>
          ${formData.sensorAreas
            .map(
              (sensorArea, index) =>
                `
            <SensorArea>
              <externalId>SENSOR_AREA_${formData.codeId}~0-${
                  index + 1
                }</externalId>
              <sensors>
                ${sensorArea.sensors
                  .map((sensor, sensorIndex) =>
                    `
                  <Sensor>
                    <sensorConnection>
                      <sensorUnitHardwareId>${
                        sensor.sensorUnitHardwareId
                      }</sensorUnitHardwareId>
                      <pinId>0-${index + 1}</pinId>
                    </sensorConnection>
                  </Sensor>
                `.trim()
                  )
                  .join("")}
              </sensors>
            </SensorArea>
          `
            )
            .join("")}
        </sensorAreas>
      </Import>
    `.trim();
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
    saveAs(blob, "data.xml");
  };

  return (
    <form
      className="space-y-4 p-4 bg-white text-black rounded-lg border border-gray-200 w-full md:w-2/3 mx-auto mt-8"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="w-full flex justify-center items-center py-4 bg-white">
        <header>
          <Link href="/" legacyBehavior>
            <a className="flex justify-center">
              <Image
                src="/innbitLogo.svg"
                width={200}
                height={50}
                alt="Innbit Logo"
                priority
              />
            </a>
          </Link>
        </header>
      </div>
      <div className="flex flex-wrap -mx-2">
        <div className="px-2 w-full md:w-1/2">
          <label className="block">Code ID</label>
          <input
            className="border p-2 rounded-lg w-full"
            placeholder="e.g., 0123456789ac"
            type="text"
            name="codeId"
            value={formData.codeId}
            onChange={(e) => handleChange(e)}
          />
        </div>
        <div className="px-2 w-full md:w-1/2">
          <label className="block">Human Readable ID</label>
          <input
            className="border p-2 rounded-lg w-full"
            placeholder="e.g., MS-222222"
            type="text"
            name="humanReadableId"
            value={formData.humanReadableId}
            onChange={(e) => handleChange(e)}
          />
        </div>
        <div className="px-2 w-full md:w-1/2">
          <label className="block">Model External ID</label>
          <input
            className="border p-2 rounded-lg w-full"
            placeholder="e.g., a1b2c3d4e5f6"
            type="text"
            name="modelExternalId"
            value={formData.modelExternalId}
            onChange={(e) => handleChange(e)}
          />
        </div>
        <div className="px-2 w-full md:w-1/2">
          <label className="block">Hardware Version</label>
          <input
            className="border p-2 rounded-lg w-full"
            placeholder="e.g., 2023-11-15.1"
            type="text"
            name="hardwareVersion"
            value={formData.hardwareVersion}
            onChange={(e) => handleChange(e)}
          />
        </div>
        <div className="px-2 w-full md:w-1/2">
          <label className="block">Retailer External ID</label>
          <input
            className="border p-2 rounded-lg w-full"
            placeholder="e.g., RET-001"
            type="text"
            name="retailerExternalId"
            value={formData.retailerExternalId}
            onChange={(e) => handleChange(e)}
          />
        </div>
        <div className="px-2 w-full md:w-1/2">
          <label className="block">Activated</label>
          <input
            type="checkbox"
            name="activated"
            checked={formData.activated}
            onChange={(e) => handleChange(e)}
            className="rounded"
          />
        </div>
        <div className="px-2 w-full md:w-1/2">
          <label className="block">Sensor Unit Hardware ID</label>
          <input
            className="border p-2 rounded-lg w-full"
            placeholder="get this from the Hardware ID"
            type="text"
            name="hardwareId"
            value={formData.hardwareId}
            onChange={(e) => handleChange(e)}
          />
        </div>
        <div className="px-2 w-full md:w-1/2">
          <label className="block">Sensor Unit Bluetooth ID</label>
          <input
            className="border p-2 rounded-lg w-full"
            placeholder="get this from the Hardware ID"
            type="text"
            name="bluetoothId"
            value={formData.bluetoothId}
            onChange={(e) => handleChange(e)}
          />
        </div>
      </div>

      {/* Compartments */}
      <div>
        {formData.compartments.map((compartment, index) => (
          <div key={index} className="border p-4 rounded-lg my-2 px-2 w-full">
            <h3 className="font-bold">Compartment {index + 1}</h3>
            <div>
              <label className="block">Compartment Code ID</label>
              <input
                className="border p-2 rounded-lg w-full"
                type="text"
                name="codeId"
                value={compartment.codeId}
                onChange={(e) => handleChange(e, "compartments", index)}
              />
            </div>

            <div>
              <label className="block">Compartment Human Readable ID</label>
              <input
                className="border p-2 rounded-lg w-full"
                type="text"
                name="humanReadableId"
                value={compartment.humanReadableId}
                onChange={(e) => handleChange(e, "compartments", index)}
              />
            </div>
            <div>
              <div>
                <label className="block">Sensor Area External IDs</label>
                {compartment.sensorAreaExternalIds.map((id, idIndex) => (
                  <input
                    key={idIndex}
                    className="border p-2 mb-2 block rounded-lg w-full"
                    type="text"
                    name="sensorAreaExternalIds"
                    value={id}
                    onChange={(e) =>
                      handleChange(e, "compartments", index, idIndex)
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
        <button
          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-700"
          type="button"
          onClick={addCompartment}
        >
          Add Compartment
        </button>
        {formData.compartments.length > 1 && (
          <button
            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-700 ml-2"
            type="button"
            onClick={deleteCompartment}
            disabled={formData.compartments.length <= 1}
          >
            Delete Compartment
          </button>
        )}

        {/* Sensor Areas */}
        {formData.sensorAreas.map((sensorArea, index) => (
          <div key={index} className="border p-4 rounded-lg my-2">
            <h3 className="font-bold">Sensor Area {index + 1}</h3>
            <div>
              <label className="block">Sensor Area External ID</label>
              <input
                className="border p-2 rounded-lg w-full"
                type="text"
                name="externalId"
                value={sensorArea.externalId}
                onChange={(e) => handleChange(e, "sensorAreas", index)}
              />
            </div>
            {sensorArea.sensors.map((sensor, sensorIndex) => (
              <div key={sensorIndex} className="mb-2 mt-2">
                <label className="block">Sensor Unit Hardware ID</label>
                <input
                  className="border p-2 rounded-lg w-full"
                  type="text"
                  name="sensorUnitHardwareId"
                  value={sensor.sensorUnitHardwareId}
                  onChange={(e) =>
                    handleChange(e, "sensorAreas", index, sensorIndex)
                  }
                />

                <label className="block">Pin ID</label>
                <input
                  className="border p-2 rounded-lg w-full"
                  type="text"
                  name="pinId"
                  value={sensor.pinId}
                  onChange={(e) =>
                    handleChange(e, "sensorAreas", index, sensorIndex)
                  }
                />
              </div>
            ))}
          </div>
        ))}
        <div className="">
          <button
            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-700"
            type="button"
            onClick={addSensorArea}
          >
            Add Sensor Area
          </button>
          {formData.sensorAreas.length > 1 && (
            <button
              type="button"
              onClick={deleteSensorArea}
              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-700 ml-2"
            >
              Delete Sensor Area
            </button>
          )}
        </div>
      </div>
      <button
        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-700"
        type="button"
        onClick={generateXML}
      >
        Generate XML
      </button>
    </form>
  );
};

export default XmlForm;
