<Table hover responsive className="align-middle">
  <thead className="bg-primary text-white">
    <tr>
      <th>#</th>
      {columns.map((col, i) => (
        <th key={i}>{col.header}</th>
      ))}
      <th>الإجراءات</th>
    </tr>
  </thead>

  <tbody>
    {data.map((item, idx) => (
      <tr key={item._id}>
        <td>{idx + 1}</td>

        {columns.map((col, i) => (
          <td key={i}>
            {col.key === "image" || col.key === "images" ? (
              <ImageGallery images={item.images || []} size="sm" showCount />
            ) : col.key === "status" ? (
              <Form.Check
                type="switch"
                checked={item.isActive}
                onChange={() => onToggle(item._id)}
              />
            ) : col.key === "name" ? (
              <div>
                <div className="fw-bold">
                  {lang === "ar" ? item.name?.ar : item.name?.en}
                </div>
                <small className="text-muted">
                  {lang === "ar" ? item.description?.ar : item.description?.en}
                </small>
              </div>
            ) : col.key === "type" ? (
              <span className="badge bg-info">
                {lang === "ar" ? item.visaType?.nameAr : item.visaType?.nameEn}
              </span>
            ) : (
              item[col.key]
            )}
          </td>
        ))}

        <td>
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-primary" onClick={() => onEdit(item)}>
              <Edit size={16} />
            </Button>

            {onViewDetails && (
              <Button size="sm" variant="outline-info" onClick={() => onViewDetails(item)}>
                <Eye size={16} />
              </Button>
            )}

            <Button size="sm" variant="outline-danger" onClick={() => onDelete(item._id)}>
              <Trash2 size={16} />
            </Button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</Table>
