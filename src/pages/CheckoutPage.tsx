import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BrutalInput } from '../components/Common/BrutalInput';
import { BrutalButton } from '../components/Common/BrutalButton';
import { CreditCard, Mail, User, MapPin, ArrowLeft, Lock } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { cart, events, processPayment, user } = useStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: user?.name || '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const cartWithDetails = cart.map(item => {
    const event = events.find(e => e.id === item.eventId);
    const ticketType = event?.ticketTypes.find(t => t.id === item.ticketTypeId);
    return { ...item, event, ticketType };
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceFee = subtotal * 0.1;
  const finalTotal = subtotal + serviceFee;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.email) newErrors.email = 'EMAIL REQUIRED';
    if (!formData.fullName) newErrors.fullName = 'NAME REQUIRED';
    if (!formData.address) newErrors.address = 'ADDRESS REQUIRED';
    if (!formData.city) newErrors.city = 'CITY REQUIRED';
    if (!formData.zipCode) newErrors.zipCode = 'ZIP CODE REQUIRED';
    if (!formData.cardNumber) newErrors.cardNumber = 'CARD NUMBER REQUIRED';
    if (!formData.expiryDate) newErrors.expiryDate = 'EXPIRY DATE REQUIRED';
    if (!formData.cvv) newErrors.cvv = 'CVV REQUIRED';
    if (!formData.cardName) newErrors.cardName = 'CARDHOLDER NAME REQUIRED';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) return;
    
    setProcessing(true);
    setErrors({});
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const order = await processPayment({
        method: 'Credit Card',
        amount: finalTotal,
        cardLast4: formData.cardNumber.slice(-4)
      });

      navigate(`/order-confirmation/${order.id}`);
    } catch {
      setErrors({ submit: 'PAYMENT FAILED - TRY AGAIN' });
    } finally {
      setProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white border-6 border-black shadow-[12px_12px_0px_#000000] p-12 text-center">
            <h1 className="font-black text-4xl uppercase mb-6 text-black">
              YOUR CART IS EMPTY
            </h1>
            <p className="font-bold text-lg uppercase text-black mb-8">
              ADD SOME TICKETS TO PROCEED WITH CHECKOUT
            </p>
            <BrutalButton onClick={() => navigate('/events')} size="lg">
              BROWSE EVENTS
            </BrutalButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-8">
      <div className="max-w-6xl mx-auto px-4">
        <BrutalButton
          onClick={() => navigate('/cart')}
          className="mb-8 flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          BACK TO CART
        </BrutalButton>

        <h1 className="font-black text-4xl md:text-6xl uppercase mb-8 text-black text-center">
          PESTAPORA <span className="text-[#00FF00]">CHECKOUT</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-8">
            {/* Contact Information */}
            <div className="bg-white border-6 border-black shadow-[8px_8px_0px_#000000] p-6">
              <h3 className="font-black text-2xl uppercase mb-6 text-black">
                CONTACT INFORMATION
              </h3>
              <div className="space-y-4">
                <BrutalInput
                  label="EMAIL ADDRESS"
                  type="email"
                  placeholder="YOUR@PESTAPORA.EMAIL"
                  icon={<Mail className="h-5 w-5" />}
                  value={formData.email}
                  onChange={(value) => handleInputChange('email', value)}
                  error={errors.email}
                />
                <BrutalInput
                  label="FULL NAME"
                  placeholder="YOUR FULL NAME"
                  icon={<User className="h-5 w-5" />}
                  value={formData.fullName}
                  onChange={(value) => handleInputChange('fullName', value)}
                  error={errors.fullName}
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white border-6 border-black shadow-[8px_8px_0px_#000000] p-6">
              <h3 className="font-black text-2xl uppercase mb-6 text-black">
                BILLING ADDRESS
              </h3>
              <div className="space-y-4">
                <BrutalInput
                  label="ADDRESS"
                  placeholder="STREET ADDRESS"
                  icon={<MapPin className="h-5 w-5" />}
                  value={formData.address}
                  onChange={(value) => handleInputChange('address', value)}
                  error={errors.address}
                />
                <div className="grid grid-cols-2 gap-4">
                  <BrutalInput
                    label="CITY"
                    placeholder="CITY"
                    value={formData.city}
                    onChange={(value) => handleInputChange('city', value)}
                    error={errors.city}
                  />
                  <BrutalInput
                    label="ZIP CODE"
                    placeholder="ZIP CODE"
                    value={formData.zipCode}
                    onChange={(value) => handleInputChange('zipCode', value)}
                    error={errors.zipCode}
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white border-6 border-black shadow-[8px_8px_0px_#000000] p-6">
              <h3 className="font-black text-2xl uppercase mb-6 text-black">
                PAYMENT INFORMATION
              </h3>
              <div className="space-y-4">
                <BrutalInput
                  label="CARD NUMBER"
                  placeholder="1234 5678 9012 3456"
                  icon={<CreditCard className="h-5 w-5" />}
                  value={formData.cardNumber}
                  onChange={(value) => handleInputChange('cardNumber', value)}
                  error={errors.cardNumber}
                />
                <div className="grid grid-cols-2 gap-4">
                  <BrutalInput
                    label="EXPIRY DATE"
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={(value) => handleInputChange('expiryDate', value)}
                    error={errors.expiryDate}
                  />
                  <BrutalInput
                    label="CVV"
                    placeholder="123"
                    value={formData.cvv}
                    onChange={(value) => handleInputChange('cvv', value)}
                    error={errors.cvv}
                  />
                </div>
                <BrutalInput
                  label="CARDHOLDER NAME"
                  placeholder="CARDHOLDER NAME"
                  value={formData.cardName}
                  onChange={(value) => handleInputChange('cardName', value)}
                  error={errors.cardName}
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white border-6 border-black shadow-[8px_8px_0px_#000000] p-6 sticky top-8">
              <h3 className="font-black text-2xl uppercase mb-6 text-black">
                ORDER SUMMARY
              </h3>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {cartWithDetails.map((item) => (
                  <div key={`${item.eventId}-${item.ticketTypeId}`} className="border-b-2 border-black pb-4">
                    <div className="font-black text-sm uppercase text-black">
                      {item.event?.title}
                    </div>
                    <div className="font-bold text-xs uppercase text-black">
                      {item.ticketType?.name} × {item.quantity}
                    </div>
                    <div className="text-right font-black text-lg text-black">
                      Rp {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="font-bold uppercase text-black">SUBTOTAL:</span>
                  <span className="font-black text-black">Rp {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold uppercase text-black">SERVICE FEE:</span>
                  <span className="font-black text-black">Rp {serviceFee.toLocaleString()}</span>
                </div>
                <div className="border-t-4 border-black pt-4">
                  <div className="flex justify-between">
                    <span className="font-black text-xl uppercase text-black">TOTAL:</span>
                    <span className="font-black text-xl text-black">Rp {finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-[#FF0000] text-white p-4 border-4 border-black shadow-[4px_4px_0px_#000000] mb-4">
                  <p className="font-black text-center uppercase">{errors.submit}</p>
                </div>
              )}

              <BrutalButton
                onClick={handleSubmit}
                className="w-full"
                size="lg"
                disabled={processing}
              >
                {processing ? 'PROCESSING...' : `PAY Rp ${finalTotal.toLocaleString()}`}
              </BrutalButton>

              <div className="mt-6 bg-[#00FFFF] text-black p-4 border-4 border-black shadow-[4px_4px_0px_#000000]">
                <div className="flex items-center gap-2 justify-center">
                  <Lock className="h-4 w-4" />
                  <p className="font-black text-xs uppercase">SECURE SSL ENCRYPTION</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};