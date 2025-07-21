import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSalesReportData } from '../../features/auth/authApi';
import { Card, Table, Spinner, Alert, Form, Button } from 'react-bootstrap';
import { CurrencyDollar, List, FileEarmarkArrowDown } from 'react-bootstrap-icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SalesReportPage = () => {
  const dispatch = useDispatch();
  const { salesReportData, loading, error } = useSelector((state) => state.auth);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    dispatch(fetchSalesReportData({ startDate: null, endDate: null }));
  }, [dispatch]);

  const handleDateChange = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert('Start date cannot be after end date');
      return;
    }
    dispatch(fetchSalesReportData({ startDate: startDate || null, endDate: endDate || null }));
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    dispatch(fetchSalesReportData({ startDate: null, endDate: null }));
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
  };

  const paymentsList = Array.isArray(salesReportData?.payments) ? salesReportData.payments : [];

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const date = new Date().toLocaleDateString();

    // Add header
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text('Sales Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Report Generated: ${date}`, 14, 30);
    doc.text(`Date Range: ${startDate || 'All'} to ${endDate || 'All'}`, 14, 38);

    // Add summary
    doc.setFontSize(14);
    doc.text('Sales Summary', 14, 50);
    doc.setFontSize(12);
    doc.text(`Total Revenue: ₹${(salesReportData?.total_revenue || 0).toFixed(2)}`, 14, 60);
    doc.text(`Total Transactions: ${salesReportData?.payment_count || 0}`, 14, 68);

    // Add table using autoTable
    autoTable(doc, {
      startY: 80,
      head: [['ID', 'User Email', 'User Name', 'Plan', 'Amount (₹)', 'Date', 'Razorpay ID']],
      body: paymentsList.map(payment => [
        payment.id,
        payment.user_email,
        payment.user_name,
        payment.membership_plan,
        `₹${payment.amount.toFixed(2)}`,
        formatDateTime(payment.created_at),
        payment.razorpay_payment_id
      ]),
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
      margin: { top: 80, left: 14, right: 14 },
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, doc.internal.pageSize.height - 10);
    }

    // Download the PDF
    doc.save(`Sales_Report_${startDate || 'all'}_${endDate || 'all'}.pdf`);
  };

  return (
    <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Sales Report</h3>
        <Button
          variant="primary"
          onClick={handleDownloadPDF}
          disabled={loading || paymentsList.length === 0}
          style={{ backgroundColor: '#7747ff', borderColor: '#7747ff' }}
        >
          <FileEarmarkArrowDown className="me-2" />
          Download PDF
        </Button>
      </header>

      {error && (
        <Alert variant="danger" onClose={() => dispatch({ type: 'auth/clearError' })} dismissible>
          {error}
        </Alert>
      )}

      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body className="d-flex align-items-center">
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(119, 71, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                }}
              >
                <CurrencyDollar color="#7747ff" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Total Sales (INR)</h6>
                <h3 className="text-white mb-0">₹{(salesReportData?.total_revenue || 0).toFixed(2)}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4 mb-3">
          <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
            <Card.Body className="d-flex align-items-center">
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(119, 71, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                }}
              >
                <List color="#7747ff" size={24} />
              </div>
              <div>
                <h6 className="text-white-50 mb-1">Total Transactions</h6>
                <h3 className="text-white mb-0">{salesReportData?.payment_count || 0}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <div className="mb-4">
        <Form className="d-flex align-items-center gap-3">
          <Form.Group>
            <Form.Label className="text-white">Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ backgroundColor: '#101c36', color: '#fff', borderColor: '#7747ff' }}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className="text-white">End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ backgroundColor: '#101c36', color: '#fff', borderColor: '#7747ff' }}
            />
          </Form.Group>
          <div className="align-self-end">
            <Button
              variant="primary"
              onClick={handleDateChange}
              style={{ backgroundColor: '#7747ff', borderColor: '#7747ff' }}
            >
              Apply Filter
            </Button>
            <Button
              variant="outline-light"
              onClick={clearFilters}
              className="ms-2"
            >
              Clear Filters
            </Button>
          </div>
        </Form>
      </div>

      <Card style={{ backgroundColor: '#101c36', border: 'none', borderRadius: '10px' }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <div
                className="me-2"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(119, 71, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CurrencyDollar color="#7747ff" size={20} />
              </div>
              <span className="text-white">Sales Records</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="light" />
              <p className="text-white mt-2">Loading sales records...</p>
            </div>
          ) : paymentsList.length === 0 ? (
            <div className="text-center my-5">
              <p className="text-white">No sales records found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>User Email</th>
                    <th>User Name</th>
                    <th>Membership Plan</th>
                    <th>Amount (INR)</th>
                    <th>Date</th>
                    <th>Razorpay Payment ID</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.id}</td>
                      <td>{payment.user_email}</td>
                      <td>{payment.user_name}</td>
                      <td>{payment.membership_plan}</td>
                      <td>₹{payment.amount.toFixed(2)}</td>
                      <td>{formatDateTime(payment.created_at)}</td>
                      <td>{payment.razorpay_payment_id}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default SalesReportPage;