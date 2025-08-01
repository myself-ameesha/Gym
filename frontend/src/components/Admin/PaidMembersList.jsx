import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaidMembers } from '../../features/auth/authApi';
import { Card, Table, Spinner, Alert } from 'react-bootstrap';
import { People } from 'react-bootstrap-icons';

const PaidMembersList = () => {
    const dispatch = useDispatch();
    const { paidMembers, loading, error } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchPaidMembers());
    }, [dispatch]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
    };

    // Ensure paidMembers is an array before mapping
    const membersList = Array.isArray(paidMembers) ? paidMembers : [];

    return (
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#0c1427', minHeight: '100vh' }}>
            <header className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-white">Paid Members</h3>
            </header>

            {error && <Alert variant="danger" onClose={() => dispatch({ type: 'auth/clearError' })} dismissible>{error}</Alert>}

            {/* Stats Card */}
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
                                <People color="#7747ff" size={24} />
                            </div>
                            <div>
                                <h6 className="text-white-50 mb-1">Total Paid Members</h6>
                                <h3 className="text-white mb-0">{membersList.length}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
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
                                <People color="#7747ff" size={20} />
                            </div>
                            <span className="text-white">Paid Members List</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center my-5">
                            <Spinner animation="border" variant="light" />
                            <p className="text-white mt-2">Loading members...</p>
                        </div>
                    ) : membersList.length === 0 ? (
                        <div className="text-center my-5">
                            <p className="text-white">No paid members found.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table bordered hover variant="dark" style={{ backgroundColor: 'transparent' }}>
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        
                                        <th>First Name</th>
                                        <th>Last Name</th>
                                        <th>Registration Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {membersList.map((member) => (
                                        <tr key={member.email}>
                                            <td>{member.email}</td>
                                           
                                            <td>{member.first_name}</td>
                                            <td>{member.last_name}</td>
                                            <td>{formatDate(member.date_joined)}</td>
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

export default PaidMembersList;