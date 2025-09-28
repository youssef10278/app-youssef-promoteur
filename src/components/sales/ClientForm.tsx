import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Phone, Mail, MapPin } from 'lucide-react';

interface ClientData {
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
}

interface ClientFormProps {
  clientData: ClientData;
  onClientDataChange: (data: ClientData) => void;
  errors?: Record<string, string>;
}

export function ClientForm({ clientData, onClientDataChange, errors = {} }: ClientFormProps) {
  const handleChange = (field: keyof ClientData, value: string) => {
    onClientDataChange({
      ...clientData,
      [field]: value
    });
  };

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Informations Client</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nom complet */}
          <div className="space-y-2">
            <Label htmlFor="client_nom" className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>Nom complet *</span>
            </Label>
            <Input
              id="client_nom"
              value={clientData.nom}
              onChange={(e) => handleChange('nom', e.target.value)}
              placeholder="Ex: Ahmed Benali"
              className={errors.nom ? 'border-destructive' : ''}
              required
            />
            {errors.nom && (
              <p className="text-sm text-destructive">{errors.nom}</p>
            )}
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <Label htmlFor="client_telephone" className="flex items-center space-x-1">
              <Phone className="h-4 w-4" />
              <span>Téléphone</span>
            </Label>
            <Input
              id="client_telephone"
              type="tel"
              value={clientData.telephone}
              onChange={(e) => handleChange('telephone', e.target.value)}
              placeholder="Ex: +212 6 12 34 56 78"
              className={errors.telephone ? 'border-destructive' : ''}
            />
            {errors.telephone && (
              <p className="text-sm text-destructive">{errors.telephone}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="client_email" className="flex items-center space-x-1">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </Label>
          <Input
            id="client_email"
            type="email"
            value={clientData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Ex: ahmed.benali@email.com"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Adresse */}
        <div className="space-y-2">
          <Label htmlFor="client_adresse" className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>Adresse</span>
          </Label>
          <Textarea
            id="client_adresse"
            value={clientData.adresse}
            onChange={(e) => handleChange('adresse', e.target.value)}
            placeholder="Ex: 123 Rue Mohammed V, Casablanca"
            className={errors.adresse ? 'border-destructive' : ''}
            rows={3}
          />
          {errors.adresse && (
            <p className="text-sm text-destructive">{errors.adresse}</p>
          )}
        </div>

        {/* Résumé client */}
        {clientData.nom && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Résumé Client</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <User className="h-3 w-3" />
                <span>{clientData.nom}</span>
              </div>
              {clientData.telephone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3" />
                  <span>{clientData.telephone}</span>
                </div>
              )}
              {clientData.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3" />
                  <span>{clientData.email}</span>
                </div>
              )}
              {clientData.adresse && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span>{clientData.adresse}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
