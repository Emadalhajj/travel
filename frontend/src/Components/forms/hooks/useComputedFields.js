/*
useComputedFields.js

وظيفته:

إدارة الحقول المحسوبة.


*/
import {
  useState,
  useEffect,
} from "react";

export default function useComputedFields(
  formState,
  activeFields,
) {

  const [
    computedValues,
    setComputedValues,
  ] = useState({});

  useEffect(() => {

    const newComputed = {};

    activeFields.forEach((field) => {

      if (
        field?.type === "computed" &&
        typeof field?.compute === "function"
      ) {

        newComputed[field.name] =
          field.compute(
            formState,
            newComputed,
          );

      }

    });

    setComputedValues(
      newComputed,
    );

  }, [
    formState,
    activeFields,
  ]);

  return computedValues;
}