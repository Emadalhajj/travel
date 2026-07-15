import React, { useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

export default function PasswordInput({
  label,
  name = "password",
  value,
  onChange,
  placeholder = "أدخل كلمة المرور",
  required = true,
  disabled = false,
  className = "",
  errorMessage, // اختياري: لعرض رسالة خطأ تحت الحقل
  autoFocus = false,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Form.Group className={`mb-3 ${className}`}>
      {label && <Form.Label>{label}</Form.Label>}

      <InputGroup>
        <Form.Control
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          {...rest}
          className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />

        {/* زر العين داخل الحقل */}
        <Button
          variant="outline-secondary"
          onClick={togglePasswordVisibility}
          type="button"
          disabled={disabled}
          className="border border-start-1 rounded-start-1 px-3 hover:bg-gray-100"
          title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        >
          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
        </Button>
      </InputGroup>

      {errorMessage && (
        <Form.Text className="text-danger">{errorMessage}</Form.Text>
      )}
    </Form.Group>
  );
}
