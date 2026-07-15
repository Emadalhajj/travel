/*
CheckboxGroupField.jsx

وظيفته:

checkbox متعدد.
*/
import {
  Form,
  Row,
  Col,
} from "react-bootstrap";

export default function CheckboxGroupField(
  props,
) {

  const {
    field,
    formState,
    setFormState,
    isArabic,
    helpers,
  } = props;

  if (!field) {
    return null;
  }

  const options =
    field.options || [];

  return (
    <div className="border rounded p-3 bg-light">

      <Row className="g-2">

        {options.map((opt) => (

          <Col
            md={4}
            sm={6}
            xs={12}
            key={opt.key}
          >

            <Form.Check

              label={
                isArabic
                  ? opt.labelAr
                  : opt.labelEn
              }

              checked={
                !!formState?.[
                  field.name
                ]?.[
                  opt.key
                ]
              }

              onChange={(e) => {

                setFormState(
                  (prev) => ({

                    ...prev,

                    [field.name]: {

                      ...prev?.[
                        field.name
                      ],

                      [opt.key]:
                        e.target.checked,

                    },

                  }),
                );

                helpers.clearFieldError(
                  field,
                );

              }}

            />

          </Col>

        ))}

      </Row>

    </div>
  );
}